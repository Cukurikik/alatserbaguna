import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ProcessingStatus, AudioErrorCode, ExportFormat } from '../shared/types/audio.types';
import { FadeService } from './fade.service';
import { FadeCurve } from './fade.schema';

export interface FadeState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
  logs: string[];
}

const initialState: FadeState = {
  inputFile: null, status: 'idle', progress: 0, outputBlob: null,
  outputSizeMB: null, errorCode: null, errorMessage: null, retryable: true, logs: []
};

export const FadeActions = createActionGroup({
  source: '[Fade]',
  events: {
    'Load File': props<{ file: File }>(),
    'Start Processing': props<{ format: ExportFormat, fadeInDuration: number, fadeOutDuration: number, curve: FadeCurve }>(),
    'Update Progress': props<{ value: number }>(),
    'Worker Log': props<{ message: string }>(),
    'Processing Success': props<{ outputBlob: Blob, sizeMB: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Reset State': emptyProps(),
  }
});

export const fadeReducer = createReducer(
  initialState,
  on(FadeActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'idle' as ProcessingStatus, errorMessage: null })),
  on(FadeActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorMessage: null, logs: [] })),
  on(FadeActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(FadeActions.workerLog, (s, { message }) => ({ ...s, logs: [...s.logs, message] })),
  on(FadeActions.processingSuccess, (s, { outputBlob, sizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB: sizeMB })),
  on(FadeActions.processingFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(FadeActions.resetState, () => ({ ...initialState }))
);

export const selectFadeState = createFeatureSelector<FadeState>('fade');
export const selectFadeStatus = createSelector(selectFadeState, s => s.status);

export const processFadeEffect = createEffect(
  (actions$ = inject(Actions), fadeService = inject(FadeService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(FadeActions.startProcessing),
      withLatestFrom(store.select(selectFadeState)),
      exhaustMap(([{ format, fadeInDuration, fadeOutDuration, curve }, state]) => {
        if (!state.inputFile) return of(FadeActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No file.' }));
        return fadeService.applyFade(state.inputFile, format, fadeInDuration, fadeOutDuration, curve).pipe(
          map(event => {
            if (event.type === 'progress') return FadeActions.updateProgress({ value: event.value || 0 });
            if (event.type === 'complete' && event.data) return FadeActions.processingSuccess({ outputBlob: event.data.blob, sizeMB: event.data.sizeMB });
            if (event.type === 'log' && event.message) return FadeActions.workerLog({ message: event.message });
            return FadeActions.updateProgress({ value: 0 });
          }),
          catchError(err => of(FadeActions.processingFailure({ errorCode: err.errorCode || 'ENCODE_FAILED', message: err.message || 'Unknown' })))
        );
      })
    );
  },
  { functional: true }
);
