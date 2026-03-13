import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ProcessingStatus, AudioErrorCode, ExportFormat } from '../shared/types/audio.types';
import { NormalizerService } from './normalizer.service';

export interface NormalizerState {
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

const initialState: NormalizerState = {
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

export const NormalizerActions = createActionGroup({
  source: '[Normalizer]',
  events: {
    'Load File': props<{ file: File }>(),
    'Start Processing': props<{ format: ExportFormat, mode: 'peak' | 'lufs', targetLevel: number, truePeak: number }>(),
    'Update Progress': props<{ value: number }>(),
    'Worker Log': props<{ message: string }>(),
    'Processing Success': props<{ outputBlob: Blob, sizeMB: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Reset State': emptyProps(),
  }
});

export const normalizerReducer = createReducer(
  initialState,
  on(NormalizerActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'idle' as ProcessingStatus, errorMessage: null, errorCode: null })),
  on(NormalizerActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorMessage: null, logs: [] })),
  on(NormalizerActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(NormalizerActions.workerLog, (s, { message }) => ({ ...s, logs: [...s.logs, message] })),
  on(NormalizerActions.processingSuccess, (s, { outputBlob, sizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB: sizeMB })),
  on(NormalizerActions.processingFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(NormalizerActions.resetState, () => ({ ...initialState }))
);

export const selectNormalizerState = createFeatureSelector<NormalizerState>('normalizer');
export const selectNormalizerStatus = createSelector(selectNormalizerState, s => s.status);

export const processNormalizerEffect = createEffect(
  (actions$ = inject(Actions), normalizerService = inject(NormalizerService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(NormalizerActions.startProcessing),
      withLatestFrom(store.select(selectNormalizerState)),
      exhaustMap(([{ format, mode, targetLevel, truePeak }, state]) => {
        if (!state.inputFile) return of(NormalizerActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file selected.' }));
        
        return normalizerService.applyNormalization(state.inputFile, format, mode, targetLevel, truePeak).pipe(
          map(event => {
            if (event.type === 'progress') {
               return NormalizerActions.updateProgress({ value: event.value || 0 });
            } else if (event.type === 'complete' && event.data) {
               return NormalizerActions.processingSuccess({ outputBlob: event.data.blob, sizeMB: event.data.sizeMB });
            } else if (event.type === 'log' && event.message) {
               return NormalizerActions.workerLog({ message: event.message });
            }
            return NormalizerActions.updateProgress({ value: 0 });
          }),
          catchError(err => of(NormalizerActions.processingFailure({ 
            errorCode: err.errorCode || 'ENCODE_FAILED', 
            message: err.message || 'Unknown processing error' 
          })))
        );
      })
    );
  },
  { functional: true }
);
