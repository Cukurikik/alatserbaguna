import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ProcessingStatus, AudioErrorCode, ExportFormat } from '../shared/types/audio.types';
import { WatermarkService } from './watermark.service';
import { WatermarkMode } from './watermark.schema';

export interface WatermarkState {
  inputFile: File | null; status: ProcessingStatus; progress: number;
  outputBlob: Blob | null; outputSizeMB: number | null;
  detectedText: string | null; detectionConfidence: number | null;
  errorCode: AudioErrorCode | null; errorMessage: string | null; retryable: boolean; logs: string[];
}
const initial: WatermarkState = { inputFile: null, status: 'idle', progress: 0, outputBlob: null, outputSizeMB: null, detectedText: null, detectionConfidence: null, errorCode: null, errorMessage: null, retryable: true, logs: [] };

export const WatermarkActions = createActionGroup({
  source: '[Watermark]',
  events: {
    'Load File': props<{ file: File }>(),
    'Start Processing': props<{ format: ExportFormat, mode: WatermarkMode, watermarkText: string, strength: number }>(),
    'Update Progress': props<{ value: number }>(),
    'Worker Log': props<{ message: string }>(),
    'Processing Success': props<{ outputBlob: Blob | null, sizeMB: number | null, detectedText: string | null, confidence: number | null }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Reset State': emptyProps(),
  }
});

export const watermarkReducer = createReducer(
  initial,
  on(WatermarkActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'idle' as ProcessingStatus, outputBlob: null, detectedText: null, errorMessage: null })),
  on(WatermarkActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, detectedText: null, errorMessage: null, logs: [] })),
  on(WatermarkActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(WatermarkActions.workerLog, (s, { message }) => ({ ...s, logs: [...s.logs, message] })),
  on(WatermarkActions.processingSuccess, (s, { outputBlob, sizeMB, detectedText, confidence }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB: sizeMB, detectedText, detectionConfidence: confidence })),
  on(WatermarkActions.processingFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(WatermarkActions.resetState, () => ({ ...initial }))
);

export const selectWatermarkState = createFeatureSelector<WatermarkState>('audioWatermark');

export const processWatermarkEffect = createEffect(
  (actions$ = inject(Actions), watermarkService = inject(WatermarkService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(WatermarkActions.startProcessing),
      withLatestFrom(store.select(selectWatermarkState)),
      exhaustMap(([{ format, mode, watermarkText, strength }, state]) => {
        if (!state.inputFile) return of(WatermarkActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No file.' }));
        return watermarkService.process(state.inputFile, format, mode, watermarkText, strength).pipe(
          map(event => {
            if (event.type === 'progress') return WatermarkActions.updateProgress({ value: event.value || 0 });
            if (event.type === 'complete' && event.data) return WatermarkActions.processingSuccess({ outputBlob: event.data.blob, sizeMB: event.data.sizeMB, detectedText: event.data.detectedText, confidence: event.data.confidence });
            if (event.type === 'log' && event.message) return WatermarkActions.workerLog({ message: event.message });
            return WatermarkActions.updateProgress({ value: 0 });
          }),
          catchError(err => of(WatermarkActions.processingFailure({ errorCode: err.errorCode || 'ENCODE_FAILED', message: err.message || 'Error' })))
        );
      })
    );
  },
  { functional: true }
);

export const watermarkProcessingEffect = processWatermarkEffect;
