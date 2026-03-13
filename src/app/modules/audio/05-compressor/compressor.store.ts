import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ProcessingStatus, AudioErrorCode, ExportFormat } from '../shared/types/audio.types';
import { CompressorService } from './compressor.service';

export interface CompressorState {
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

const initialState: CompressorState = {
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

export const CompressorActions = createActionGroup({
  source: '[Compressor]',
  events: {
    'Load File': props<{ file: File }>(),
    'Start Processing': props<{ format: ExportFormat, thresholdDb: number, ratio: number, attackMs: number, releaseMs: number, makeupGainDb: number }>(),
    'Update Progress': props<{ value: number }>(),
    'Worker Log': props<{ message: string }>(),
    'Processing Success': props<{ outputBlob: Blob, sizeMB: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Reset State': emptyProps(),
  }
});

export const compressorReducer = createReducer(
  initialState,
  on(CompressorActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'idle' as ProcessingStatus, errorMessage: null, errorCode: null })),
  on(CompressorActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorMessage: null, logs: [] })),
  on(CompressorActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(CompressorActions.workerLog, (s, { message }) => ({ ...s, logs: [...s.logs, message] })),
  on(CompressorActions.processingSuccess, (s, { outputBlob, sizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB: sizeMB })),
  on(CompressorActions.processingFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(CompressorActions.resetState, () => ({ ...initialState }))
);

export const selectCompressorState = createFeatureSelector<CompressorState>('compressor');
export const selectCompressorStatus = createSelector(selectCompressorState, s => s.status);

export const processCompressorEffect = createEffect(
  (actions$ = inject(Actions), compressorService = inject(CompressorService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(CompressorActions.startProcessing),
      withLatestFrom(store.select(selectCompressorState)),
      exhaustMap(([{ format, thresholdDb, ratio, attackMs, releaseMs, makeupGainDb }, state]) => {
        if (!state.inputFile) return of(CompressorActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file selected.' }));
        
        return compressorService.compressAudio(state.inputFile, format, thresholdDb, ratio, attackMs, releaseMs, makeupGainDb).pipe(
          map(event => {
            if (event.type === 'progress') {
               return CompressorActions.updateProgress({ value: event.value || 0 });
            } else if (event.type === 'complete' && event.data) {
               return CompressorActions.processingSuccess({ outputBlob: event.data.blob, sizeMB: event.data.sizeMB });
            } else if (event.type === 'log' && event.message) {
               return CompressorActions.workerLog({ message: event.message });
            }
            return CompressorActions.updateProgress({ value: 0 });
          }),
          catchError(err => of(CompressorActions.processingFailure({ 
            errorCode: err.errorCode || 'ENCODE_FAILED', 
            message: err.message || 'Unknown processing error' 
          })))
        );
      })
    );
  },
  { functional: true }
);
