import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ProcessingStatus, AudioErrorCode, ExportFormat } from '../shared/types/audio.types';
import { SpeedService } from './speed.service';

export interface SpeedState {
  inputFile: File | null; status: ProcessingStatus; progress: number;
  outputBlob: Blob | null; outputSizeMB: number | null;
  errorCode: AudioErrorCode | null; errorMessage: string | null; retryable: boolean; logs: string[];
}
const initial: SpeedState = { inputFile: null, status: 'idle', progress: 0, outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: true, logs: [] };

export const SpeedActions = createActionGroup({
  source: '[Speed]',
  events: {
    'Load File': props<{ file: File }>(),
    'Start Processing': props<{ format: ExportFormat, speed: number, pitchLock: boolean }>(),
    'Update Progress': props<{ value: number }>(),
    'Worker Log': props<{ message: string }>(),
    'Processing Success': props<{ outputBlob: Blob, sizeMB: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Reset State': emptyProps(),
  }
});

export const speedReducer = createReducer(
  initial,
  on(SpeedActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'idle' as ProcessingStatus, outputBlob: null, errorMessage: null })),
  on(SpeedActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorMessage: null, logs: [] })),
  on(SpeedActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(SpeedActions.workerLog, (s, { message }) => ({ ...s, logs: [...s.logs, message] })),
  on(SpeedActions.processingSuccess, (s, { outputBlob, sizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB: sizeMB })),
  on(SpeedActions.processingFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(SpeedActions.resetState, () => ({ ...initial }))
);

export const selectSpeedState = createFeatureSelector<SpeedState>('audioSpeed');

export const processSpeedEffect = createEffect(
  (actions$ = inject(Actions), speedService = inject(SpeedService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(SpeedActions.startProcessing),
      withLatestFrom(store.select(selectSpeedState)),
      exhaustMap(([{ format, speed, pitchLock }, state]) => {
        if (!state.inputFile) return of(SpeedActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No file.' }));
        return speedService.changeSpeed(state.inputFile, format, speed, pitchLock).pipe(
          map(event => {
            if (event.type === 'progress') return SpeedActions.updateProgress({ value: event.value || 0 });
            if (event.type === 'complete' && event.data) return SpeedActions.processingSuccess({ outputBlob: event.data.blob, sizeMB: event.data.sizeMB });
            if (event.type === 'log' && event.message) return SpeedActions.workerLog({ message: event.message });
            return SpeedActions.updateProgress({ value: 0 });
          }),
          catchError(err => of(SpeedActions.processingFailure({ errorCode: err.errorCode || 'ENCODE_FAILED', message: err.message || 'Error' })))
        );
      })
    );
  },
  { functional: true }
);
