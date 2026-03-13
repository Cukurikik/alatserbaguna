import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ProcessingStatus, AudioErrorCode, ExportFormat } from '../shared/types/audio.types';
import { KaraokeService } from './karaoke.service';
import { KaraokeOutput } from './karaoke.schema';

export interface KaraokeState {
  inputFile: File | null; status: ProcessingStatus; progress: number;
  outputBlob: Blob | null; outputSizeMB: number | null;
  errorCode: AudioErrorCode | null; errorMessage: string | null; retryable: boolean; logs: string[];
}
const initial: KaraokeState = { inputFile: null, status: 'idle', progress: 0, outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: true, logs: [] };

export const KaraokeActions = createActionGroup({
  source: '[Karaoke]',
  events: {
    'Load File': props<{ file: File }>(),
    'Start Processing': props<{ format: ExportFormat, outputTarget: KaraokeOutput, strength: number }>(),
    'Update Progress': props<{ value: number }>(),
    'Worker Log': props<{ message: string }>(),
    'Processing Success': props<{ outputBlob: Blob, sizeMB: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Reset State': emptyProps(),
  }
});

export const karaokeReducer = createReducer(
  initial,
  on(KaraokeActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'idle' as ProcessingStatus, outputBlob: null, errorMessage: null })),
  on(KaraokeActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorMessage: null, logs: [] })),
  on(KaraokeActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(KaraokeActions.workerLog, (s, { message }) => ({ ...s, logs: [...s.logs, message] })),
  on(KaraokeActions.processingSuccess, (s, { outputBlob, sizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB: sizeMB })),
  on(KaraokeActions.processingFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(KaraokeActions.resetState, () => ({ ...initial }))
);

export const selectKaraokeState = createFeatureSelector<KaraokeState>('karaoke');

export const processKaraokeEffect = createEffect(
  (actions$ = inject(Actions), karaokeService = inject(KaraokeService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(KaraokeActions.startProcessing),
      withLatestFrom(store.select(selectKaraokeState)),
      exhaustMap(([{ format, outputTarget, strength }, state]) => {
        if (!state.inputFile) return of(KaraokeActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No file.' }));
        return karaokeService.process(state.inputFile, format, outputTarget, strength).pipe(
          map(event => {
            if (event.type === 'progress') return KaraokeActions.updateProgress({ value: event.value || 0 });
            if (event.type === 'complete' && event.data) return KaraokeActions.processingSuccess({ outputBlob: event.data.blob, sizeMB: event.data.sizeMB });
            if (event.type === 'log' && event.message) return KaraokeActions.workerLog({ message: event.message });
            return KaraokeActions.updateProgress({ value: 0 });
          }),
          catchError(err => of(KaraokeActions.processingFailure({ errorCode: err.errorCode || 'ENCODE_FAILED', message: err.message || 'Error' })))
        );
      })
    );
  },
  { functional: true }
);
