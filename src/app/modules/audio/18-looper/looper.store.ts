import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ProcessingStatus, AudioErrorCode, ExportFormat } from '../shared/types/audio.types';
import { LooperService } from './looper.service';

export interface LooperState {
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

const initialState: LooperState = {
  inputFile: null, status: 'idle', progress: 0, outputBlob: null,
  outputSizeMB: null, errorCode: null, errorMessage: null, retryable: true, logs: []
};

export const LooperActions = createActionGroup({
  source: '[Looper]',
  events: {
    'Load File': props<{ file: File }>(),
    'Start Processing': props<{ format: ExportFormat, repeatCount: number, crossfadeDurationSec: number }>(),
    'Update Progress': props<{ value: number }>(),
    'Worker Log': props<{ message: string }>(),
    'Processing Success': props<{ outputBlob: Blob, sizeMB: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Reset State': emptyProps(),
  }
});

export const looperReducer = createReducer(
  initialState,
  on(LooperActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'idle' as ProcessingStatus, errorMessage: null })),
  on(LooperActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorMessage: null, logs: [] })),
  on(LooperActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(LooperActions.workerLog, (s, { message }) => ({ ...s, logs: [...s.logs, message] })),
  on(LooperActions.processingSuccess, (s, { outputBlob, sizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB: sizeMB })),
  on(LooperActions.processingFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(LooperActions.resetState, () => ({ ...initialState }))
);

export const selectLooperState = createFeatureSelector<LooperState>('looper');
export const selectLooperStatus = createSelector(selectLooperState, s => s.status);

export const processLooperEffect = createEffect(
  (actions$ = inject(Actions), looperService = inject(LooperService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(LooperActions.startProcessing),
      withLatestFrom(store.select(selectLooperState)),
      exhaustMap(([{ format, repeatCount, crossfadeDurationSec }, state]) => {
        if (!state.inputFile) return of(LooperActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No file.' }));
        return looperService.applyLoop(state.inputFile, format, repeatCount, crossfadeDurationSec).pipe(
          map(event => {
            if (event.type === 'progress') return LooperActions.updateProgress({ value: event.value || 0 });
            if (event.type === 'complete' && event.data) return LooperActions.processingSuccess({ outputBlob: event.data.blob, sizeMB: event.data.sizeMB });
            if (event.type === 'log' && event.message) return LooperActions.workerLog({ message: event.message });
            return LooperActions.updateProgress({ value: 0 });
          }),
          catchError(err => of(LooperActions.processingFailure({ errorCode: err.errorCode || 'ENCODE_FAILED', message: err.message || 'Unknown error' })))
        );
      })
    );
  },
  { functional: true }
);
