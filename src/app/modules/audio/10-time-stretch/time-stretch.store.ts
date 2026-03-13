import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ProcessingStatus, AudioErrorCode, ExportFormat } from '../shared/types/audio.types';
import { TimeStretchService } from './time-stretch.service';

export interface TimeStretchState {
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

const initialState: TimeStretchState = {
  inputFile: null,
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: true,
  logs: []
};

export const TimeStretchActions = createActionGroup({
  source: '[TimeStretch]',
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

export const timeStretchReducer = createReducer(
  initialState,
  on(TimeStretchActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'idle' as ProcessingStatus, errorMessage: null, errorCode: null })),
  on(TimeStretchActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorMessage: null, logs: [] })),
  on(TimeStretchActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(TimeStretchActions.workerLog, (s, { message }) => ({ ...s, logs: [...s.logs, message] })),
  on(TimeStretchActions.processingSuccess, (s, { outputBlob, sizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB: sizeMB })),
  on(TimeStretchActions.processingFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(TimeStretchActions.resetState, () => ({ ...initialState }))
);

export const selectTimeStretchState = createFeatureSelector<TimeStretchState>('timeStretch');
export const selectTimeStretchStatus = createSelector(selectTimeStretchState, s => s.status);

export const processTimeStretchEffect = createEffect(
  (actions$ = inject(Actions), timeStretchService = inject(TimeStretchService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(TimeStretchActions.startProcessing),
      withLatestFrom(store.select(selectTimeStretchState)),
      exhaustMap(([{ format, speed, pitchLock }, state]) => {
        if (!state.inputFile) return of(TimeStretchActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file selected.' }));
        
        return timeStretchService.applyTimeStretch(state.inputFile, format, speed, pitchLock).pipe(
          map(event => {
            if (event.type === 'progress') {
               return TimeStretchActions.updateProgress({ value: event.value || 0 });
            } else if (event.type === 'complete' && event.data) {
               return TimeStretchActions.processingSuccess({ outputBlob: event.data.blob, sizeMB: event.data.sizeMB });
            } else if (event.type === 'log' && event.message) {
               return TimeStretchActions.workerLog({ message: event.message });
            }
            return TimeStretchActions.updateProgress({ value: 0 });
          }),
          catchError(err => of(TimeStretchActions.processingFailure({ 
            errorCode: err.errorCode || 'ENCODE_FAILED', 
            message: err.message || 'Unknown processing error' 
          })))
        );
      })
    );
  },
  { functional: true }
);
