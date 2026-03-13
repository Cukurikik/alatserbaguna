import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ProcessingStatus, AudioErrorCode, ExportFormat } from '../shared/types/audio.types';
import { LimiterService } from './limiter.service';

export interface LimiterState {
  inputFile: File | null; status: ProcessingStatus; progress: number;
  outputBlob: Blob | null; outputSizeMB: number | null;
  errorCode: AudioErrorCode | null; errorMessage: string | null; retryable: boolean; logs: string[];
}
const initial: LimiterState = { inputFile: null, status: 'idle', progress: 0, outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: true, logs: [] };

export const LimiterActions = createActionGroup({
  source: '[Limiter]',
  events: {
    'Load File': props<{ file: File }>(),
    'Start Processing': props<{ format: ExportFormat, ceiling: number, lookaheadMs: number, release: number, targetLUFS: number | null, truePeak: boolean }>(),
    'Update Progress': props<{ value: number }>(),
    'Worker Log': props<{ message: string }>(),
    'Processing Success': props<{ outputBlob: Blob, sizeMB: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Reset State': emptyProps(),
  }
});

export const limiterReducer = createReducer(
  initial,
  on(LimiterActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'idle' as ProcessingStatus, outputBlob: null, errorMessage: null })),
  on(LimiterActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorMessage: null, logs: [] })),
  on(LimiterActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(LimiterActions.workerLog, (s, { message }) => ({ ...s, logs: [...s.logs, message] })),
  on(LimiterActions.processingSuccess, (s, { outputBlob, sizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB: sizeMB })),
  on(LimiterActions.processingFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(LimiterActions.resetState, () => ({ ...initial }))
);

export const selectLimiterState = createFeatureSelector<LimiterState>('limiter');

export const processLimiterEffect = createEffect(
  (actions$ = inject(Actions), limiterService = inject(LimiterService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(LimiterActions.startProcessing),
      withLatestFrom(store.select(selectLimiterState)),
      exhaustMap(([{ format, ceiling, lookaheadMs, release, targetLUFS, truePeak }, state]) => {
        if (!state.inputFile) return of(LimiterActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No file.' }));
        return limiterService.applyLimiter(state.inputFile, format, ceiling, lookaheadMs, release, targetLUFS, truePeak).pipe(
          map(event => {
            if (event.type === 'progress') return LimiterActions.updateProgress({ value: event.value || 0 });
            if (event.type === 'complete' && event.data) return LimiterActions.processingSuccess({ outputBlob: event.data.blob, sizeMB: event.data.sizeMB });
            if (event.type === 'log' && event.message) return LimiterActions.workerLog({ message: event.message });
            return LimiterActions.updateProgress({ value: 0 });
          }),
          catchError(err => of(LimiterActions.processingFailure({ errorCode: err.errorCode || 'ENCODE_FAILED', message: err.message || 'Error' })))
        );
      })
    );
  },
  { functional: true }
);
