import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

// ─── State ───────────────────────────────────────────────────────────────────
export interface VisualizerState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: VisualizerState = {
  inputFile: null,
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false,
};

// ─── Actions ─────────────────────────────────────────────────────────────────
export const VisualizerActions = createActionGroup({
  source: '[Visualizer]',
  events: {
    'Load File': props<{ file: File }>(),
    'Start Processing': props<{ format: ExportFormat }>(),
    'Update Progress': props<{ value: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

// ─── Reducer ─────────────────────────────────────────────────────────────────
export const visualizerReducer = createReducer(
  initialState,
  on(VisualizerActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'idle' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(VisualizerActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(VisualizerActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(VisualizerActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(VisualizerActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(VisualizerActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectVisualizerState = createFeatureSelector<VisualizerState>('visualizer');
export const selectVisualizerStatus = createSelector(selectVisualizerState, (s) => s.status);
export const selectVisualizerProgress = createSelector(selectVisualizerState, (s) => s.progress);
export const selectVisualizerOutputBlob = createSelector(selectVisualizerState, (s) => s.outputBlob);
export const selectVisualizerOutputSizeMB = createSelector(selectVisualizerState, (s) => s.outputSizeMB);
export const selectVisualizerErrorMessage = createSelector(selectVisualizerState, (s) => s.errorMessage);
export const selectVisualizerRetryable = createSelector(selectVisualizerState, (s) => s.retryable);
export const selectVisualizerInputFile = createSelector(selectVisualizerState, (s) => s.inputFile);

// ─── Effects ─────────────────────────────────────────────────────────────────
export const visualizerProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(VisualizerActions.startProcessing),
      withLatestFrom(store.select(selectVisualizerState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) {
          return of(VisualizerActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file selected', retryable: false }));
        }
        
        return new Observable<any>(obs => {
          let aborted = false;
          const args = ["-i","{in}"]; // Feature-specific FFmpeg args
          
          ffmpeg.processAudio(
            state.inputFile!,
            format,
            args,
            (p) => { if (!aborted) store.dispatch(VisualizerActions.updateProgress({ value: p })); }
          ).then(blob => {
            if (!aborted) {
              obs.next(VisualizerActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 }));
              obs.complete();
            }
          }).catch(err => {
            if (!aborted) {
              obs.next(VisualizerActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Validation failed or FFmpeg crashed', retryable: true }));
              obs.complete();
            }
          });

          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);
