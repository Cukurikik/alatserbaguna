import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ProcessingStatus, AudioErrorCode, ExportFormat } from '../shared/types/audio.types';
import { ConverterService } from './converter.service';

export interface ConverterState {
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

const initialState: ConverterState = {
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

export const ConverterActions = createActionGroup({
  source: '[Converter]',
  events: {
    'Load File': props<{ file: File }>(),
    'Start Processing': props<{ format: ExportFormat, bitrate: string, sampleRate: number, channels: number }>(),
    'Update Progress': props<{ value: number }>(),
    'Worker Log': props<{ message: string }>(),
    'Processing Success': props<{ outputBlob: Blob, sizeMB: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Reset State': emptyProps(),
  }
});

export const converterReducer = createReducer(
  initialState,
  on(ConverterActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'idle' as ProcessingStatus, errorMessage: null, errorCode: null })),
  on(ConverterActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorMessage: null, logs: [] })),
  on(ConverterActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(ConverterActions.workerLog, (s, { message }) => ({ ...s, logs: [...s.logs, message] })),
  on(ConverterActions.processingSuccess, (s, { outputBlob, sizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB: sizeMB })),
  on(ConverterActions.processingFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(ConverterActions.resetState, () => ({ ...initialState }))
);

export const selectConverterState = createFeatureSelector<ConverterState>('converter');
export const selectConverterStatus = createSelector(selectConverterState, s => s.status);

export const processConverterEffect = createEffect(
  (actions$ = inject(Actions), converterService = inject(ConverterService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(ConverterActions.startProcessing),
      withLatestFrom(store.select(selectConverterState)),
      exhaustMap(([{ format, bitrate, sampleRate, channels }, state]) => {
        if (!state.inputFile) return of(ConverterActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file selected.' }));
        
        return converterService.convertAudio(state.inputFile, format, bitrate, sampleRate, channels).pipe(
          map(event => {
            if (event.type === 'progress') {
               return ConverterActions.updateProgress({ value: event.value || 0 });
            } else if (event.type === 'complete' && event.data) {
               return ConverterActions.processingSuccess({ outputBlob: event.data.blob, sizeMB: event.data.sizeMB });
            } else if (event.type === 'log' && event.message) {
               return ConverterActions.workerLog({ message: event.message });
            }
            return ConverterActions.updateProgress({ value: 0 });
          }),
          catchError(err => of(ConverterActions.processingFailure({ 
            errorCode: err.errorCode || 'ENCODE_FAILED', 
            message: err.message || 'Unknown processing error' 
          })))
        );
      })
    );
  },
  { functional: true }
);

export const converterProcessingEffect = processConverterEffect;
