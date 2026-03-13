import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ProcessingStatus, AudioErrorCode, ExportFormat } from '../shared/types/audio.types';
import { EchoService } from './echo.service';

export interface EchoState {
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

const initialState: EchoState = {
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

export const EchoActions = createActionGroup({
  source: '[Echo]',
  events: {
    'Load File': props<{ file: File }>(),
    'Start Processing': props<{ format: ExportFormat, delayMs: number, feedback: number, dryMix: number, wetMix: number }>(),
    'Update Progress': props<{ value: number }>(),
    'Worker Log': props<{ message: string }>(),
    'Processing Success': props<{ outputBlob: Blob, sizeMB: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Reset State': emptyProps(),
  }
});

export const echoReducer = createReducer(
  initialState,
  on(EchoActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'idle' as ProcessingStatus, errorMessage: null, errorCode: null })),
  on(EchoActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorMessage: null, logs: [] })),
  on(EchoActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(EchoActions.workerLog, (s, { message }) => ({ ...s, logs: [...s.logs, message] })),
  on(EchoActions.processingSuccess, (s, { outputBlob, sizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB: sizeMB })),
  on(EchoActions.processingFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(EchoActions.resetState, () => ({ ...initialState }))
);

export const selectEchoState = createFeatureSelector<EchoState>('echo');
export const selectEchoStatus = createSelector(selectEchoState, s => s.status);

export const processEchoEffect = createEffect(
  (actions$ = inject(Actions), echoService = inject(EchoService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(EchoActions.startProcessing),
      withLatestFrom(store.select(selectEchoState)),
      exhaustMap(([{ format, delayMs, feedback, dryMix, wetMix }, state]) => {
        if (!state.inputFile) return of(EchoActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file selected.' }));
        
        return echoService.applyEcho(state.inputFile, format, delayMs, feedback, dryMix, wetMix).pipe(
          map(event => {
            if (event.type === 'progress') {
               return EchoActions.updateProgress({ value: event.value || 0 });
            } else if (event.type === 'complete' && event.data) {
               return EchoActions.processingSuccess({ outputBlob: event.data.blob, sizeMB: event.data.sizeMB });
            } else if (event.type === 'log' && event.message) {
               return EchoActions.workerLog({ message: event.message });
            }
            return EchoActions.updateProgress({ value: 0 });
          }),
          catchError(err => of(EchoActions.processingFailure({ 
            errorCode: err.errorCode || 'ENCODE_FAILED', 
            message: err.message || 'Unknown processing error' 
          })))
        );
      })
    );
  },
  { functional: true }
);
