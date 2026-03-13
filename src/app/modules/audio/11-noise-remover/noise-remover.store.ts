import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

// ─── State ───────────────────────────────────────────────────────────────────
export interface NoiseRemoverState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: NoiseRemoverState = {
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
export const NoiseRemoverActions = createActionGroup({
  source: '[NoiseRemover]',
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
export const noiseremoverReducer = createReducer(
  initialState,
  on(NoiseRemoverActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'idle' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(NoiseRemoverActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(NoiseRemoverActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(NoiseRemoverActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(NoiseRemoverActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(NoiseRemoverActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectNoiseRemoverState = createFeatureSelector<NoiseRemoverState>('noise-remover');
export const selectNoiseRemoverStatus = createSelector(selectNoiseRemoverState, (s) => s.status);
export const selectNoiseRemoverProgress = createSelector(selectNoiseRemoverState, (s) => s.progress);
export const selectNoiseRemoverOutputBlob = createSelector(selectNoiseRemoverState, (s) => s.outputBlob);
export const selectNoiseRemoverOutputSizeMB = createSelector(selectNoiseRemoverState, (s) => s.outputSizeMB);
export const selectNoiseRemoverErrorMessage = createSelector(selectNoiseRemoverState, (s) => s.errorMessage);
export const selectNoiseRemoverRetryable = createSelector(selectNoiseRemoverState, (s) => s.retryable);
export const selectNoiseRemoverInputFile = createSelector(selectNoiseRemoverState, (s) => s.inputFile);

// ─── Effects ─────────────────────────────────────────────────────────────────
export const noiseremoverProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(NoiseRemoverActions.startProcessing),
      withLatestFrom(store.select(selectNoiseRemoverState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) {
          return of(NoiseRemoverActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file selected', retryable: false }));
        }
        
        return new Observable<any>(obs => {
          let aborted = false;
          const args = ["-i","{in}","-af","afftdn"]; // Feature-specific FFmpeg args
          
          ffmpeg.processAudio(
            state.inputFile!,
            format,
            args,
            (p) => { if (!aborted) store.dispatch(NoiseRemoverActions.updateProgress({ value: p })); }
          ).then(blob => {
            if (!aborted) {
              obs.next(NoiseRemoverActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 }));
              obs.complete();
            }
          }).catch(err => {
            if (!aborted) {
              obs.next(NoiseRemoverActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Validation failed or FFmpeg crashed', retryable: true }));
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
