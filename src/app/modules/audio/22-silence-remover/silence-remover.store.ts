import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ProcessingStatus, AudioErrorCode, ExportFormat } from '../shared/types/audio.types';
import { SilenceRemoverService } from './silence-remover.service';

export interface SilenceRemoverState {
  inputFile: File | null; status: ProcessingStatus; progress: number;
  outputBlob: Blob | null; outputSizeMB: number | null; info: string | null;
  errorCode: AudioErrorCode | null; errorMessage: string | null; retryable: boolean; logs: string[];
}
const initial: SilenceRemoverState = { inputFile: null, status: 'idle', progress: 0, outputBlob: null, outputSizeMB: null, info: null, errorCode: null, errorMessage: null, retryable: true, logs: [] };

export const SilenceRemoverActions = createActionGroup({
  source: '[SilenceRemover]',
  events: {
    'Load File': props<{ file: File }>(),
    'Start Processing': props<{ format: ExportFormat, thresholdDb: number, minSilenceDuration: number, paddingDuration: number }>(),
    'Update Progress': props<{ value: number }>(),
    'Worker Log': props<{ message: string }>(),
    'Processing Success': props<{ outputBlob: Blob, sizeMB: number, info: string }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Reset State': emptyProps(),
  }
});

export const silenceRemoverReducer = createReducer(
  initial,
  on(SilenceRemoverActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'idle' as ProcessingStatus, outputBlob: null, errorMessage: null })),
  on(SilenceRemoverActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorMessage: null, info: null, logs: [] })),
  on(SilenceRemoverActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(SilenceRemoverActions.workerLog, (s, { message }) => ({ ...s, logs: [...s.logs, message] })),
  on(SilenceRemoverActions.processingSuccess, (s, { outputBlob, sizeMB, info }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB: sizeMB, info })),
  on(SilenceRemoverActions.processingFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(SilenceRemoverActions.resetState, () => ({ ...initial }))
);

export const selectSilenceRemoverState = createFeatureSelector<SilenceRemoverState>('silenceRemover');

export const processSilenceRemoverEffect = createEffect(
  (actions$ = inject(Actions), silenceService = inject(SilenceRemoverService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(SilenceRemoverActions.startProcessing),
      withLatestFrom(store.select(selectSilenceRemoverState)),
      exhaustMap(([{ format, thresholdDb, minSilenceDuration, paddingDuration }, state]) => {
        if (!state.inputFile) return of(SilenceRemoverActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No file.' }));
        return silenceService.removeSilence(state.inputFile, format, thresholdDb, minSilenceDuration, paddingDuration).pipe(
          map(event => {
            if (event.type === 'progress') return SilenceRemoverActions.updateProgress({ value: event.value || 0 });
            if (event.type === 'complete' && event.data) return SilenceRemoverActions.processingSuccess({ outputBlob: event.data.blob, sizeMB: event.data.sizeMB, info: event.data.info });
            if (event.type === 'log' && event.message) return SilenceRemoverActions.workerLog({ message: event.message });
            return SilenceRemoverActions.updateProgress({ value: 0 });
          }),
          catchError(err => of(SilenceRemoverActions.processingFailure({ errorCode: err.errorCode || 'ENCODE_FAILED', message: err.message || 'Error' })))
        );
      })
    );
  },
  { functional: true }
);
