import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ProcessingStatus, AudioErrorCode } from '../shared/types/audio.types';
import { VisualizerService } from './visualizer.service';
import { VisualizerConfig, VisualizerStyle, VisualizerColor } from './visualizer.schema';

export interface VisualizerState {
  inputFile: File | null; status: ProcessingStatus; progress: number;
  outputBlob: Blob | null; outputSizeMB: number | null;
  errorCode: AudioErrorCode | null; errorMessage: string | null; retryable: boolean; logs: string[];
}
const initial: VisualizerState = { inputFile: null, status: 'idle', progress: 0, outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: true, logs: [] };

export const VisualizerActions = createActionGroup({
  source: '[Visualizer]',
  events: {
    'Load File': props<{ file: File }>(),
    'Start Processing': props<{ config: VisualizerConfig }>(),
    'Update Progress': props<{ value: number }>(),
    'Worker Log': props<{ message: string }>(),
    'Processing Success': props<{ outputBlob: Blob, sizeMB: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Reset State': emptyProps(),
  }
});

export const visualizerReducer = createReducer(
  initial,
  on(VisualizerActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'idle' as ProcessingStatus, outputBlob: null, errorMessage: null })),
  on(VisualizerActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorMessage: null, logs: [] })),
  on(VisualizerActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(VisualizerActions.workerLog, (s, { message }) => ({ ...s, logs: [...s.logs, message] })),
  on(VisualizerActions.processingSuccess, (s, { outputBlob, sizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB: sizeMB })),
  on(VisualizerActions.processingFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(VisualizerActions.resetState, () => ({ ...initial }))
);

export const selectVisualizerState = createFeatureSelector<VisualizerState>('visualizer');

export const processVisualizerEffect = createEffect(
  (actions$ = inject(Actions), visualizerService = inject(VisualizerService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(VisualizerActions.startProcessing),
      withLatestFrom(store.select(selectVisualizerState)),
      exhaustMap(([{ config }]) => {
        return visualizerService.generateVideo(config).pipe(
          map(event => {
            if (event.type === 'progress') return VisualizerActions.updateProgress({ value: event.value || 0 });
            if (event.type === 'complete' && event.data) return VisualizerActions.processingSuccess({ outputBlob: event.data.blob, sizeMB: event.data.sizeMB });
            if (event.type === 'log' && event.message) return VisualizerActions.workerLog({ message: event.message });
            return VisualizerActions.updateProgress({ value: 0 });
          }),
          catchError(err => of(VisualizerActions.processingFailure({ errorCode: err.errorCode || 'ENCODE_FAILED', message: err.message || 'Error' })))
        );
      })
    );
  },
  { functional: true }
);
