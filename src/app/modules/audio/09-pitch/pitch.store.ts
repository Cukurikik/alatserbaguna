import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ProcessingStatus, AudioErrorCode, ExportFormat } from '../shared/types/audio.types';
import { PitchService } from './pitch.service';

export interface PitchState {
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

const initialState: PitchState = {
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

export const PitchActions = createActionGroup({
  source: '[Pitch]',
  events: {
    'Load File': props<{ file: File }>(),
    'Start Processing': props<{ format: ExportFormat, semitones: number, preserveTempo: boolean }>(),
    'Update Progress': props<{ value: number }>(),
    'Worker Log': props<{ message: string }>(),
    'Processing Success': props<{ outputBlob: Blob, sizeMB: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Reset State': emptyProps(),
  }
});

export const pitchReducer = createReducer(
  initialState,
  on(PitchActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'idle' as ProcessingStatus, errorMessage: null, errorCode: null })),
  on(PitchActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorMessage: null, logs: [] })),
  on(PitchActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(PitchActions.workerLog, (s, { message }) => ({ ...s, logs: [...s.logs, message] })),
  on(PitchActions.processingSuccess, (s, { outputBlob, sizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB: sizeMB })),
  on(PitchActions.processingFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(PitchActions.resetState, () => ({ ...initialState }))
);

export const selectPitchState = createFeatureSelector<PitchState>('pitch');
export const selectPitchStatus = createSelector(selectPitchState, s => s.status);

export const processPitchEffect = createEffect(
  (actions$ = inject(Actions), pitchService = inject(PitchService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(PitchActions.startProcessing),
      withLatestFrom(store.select(selectPitchState)),
      exhaustMap(([{ format, semitones, preserveTempo }, state]) => {
        if (!state.inputFile) return of(PitchActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file selected.' }));
        
        return pitchService.applyPitchShift(state.inputFile, format, semitones, preserveTempo).pipe(
          map(event => {
            if (event.type === 'progress') {
               return PitchActions.updateProgress({ value: event.value || 0 });
            } else if (event.type === 'complete' && event.data) {
               return PitchActions.processingSuccess({ outputBlob: event.data.blob, sizeMB: event.data.sizeMB });
            } else if (event.type === 'log' && event.message) {
               return PitchActions.workerLog({ message: event.message });
            }
            return PitchActions.updateProgress({ value: 0 });
          }),
          catchError(err => of(PitchActions.processingFailure({ 
            errorCode: err.errorCode || 'ENCODE_FAILED', 
            message: err.message || 'Unknown processing error' 
          })))
        );
      })
    );
  },
  { functional: true }
);
