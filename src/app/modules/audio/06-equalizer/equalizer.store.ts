import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

// ─── State ───────────────────────────────────────────────────────────────────
export interface EqualizerState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: EqualizerState = {
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
export const EqualizerActions = createActionGroup({
  source: '[Equalizer]',
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
export const equalizerReducer = createReducer(
  initialState,
  on(EqualizerActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'idle' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(EqualizerActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(EqualizerActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(EqualizerActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(EqualizerActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(EqualizerActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectEqualizerState = createFeatureSelector<EqualizerState>('equalizer');
export const selectEqualizerStatus = createSelector(selectEqualizerState, (s) => s.status);
export const selectEqualizerProgress = createSelector(selectEqualizerState, (s) => s.progress);
export const selectEqualizerOutputBlob = createSelector(selectEqualizerState, (s) => s.outputBlob);
export const selectEqualizerOutputSizeMB = createSelector(selectEqualizerState, (s) => s.outputSizeMB);
export const selectEqualizerErrorMessage = createSelector(selectEqualizerState, (s) => s.errorMessage);
export const selectEqualizerRetryable = createSelector(selectEqualizerState, (s) => s.retryable);
export const selectEqualizerInputFile = createSelector(selectEqualizerState, (s) => s.inputFile);

// ─── Effects ─────────────────────────────────────────────────────────────────
export const equalizerProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(EqualizerActions.startProcessing),
      withLatestFrom(store.select(selectEqualizerState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) {
          return of(EqualizerActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file selected', retryable: false }));
        }
        
        return new Observable<any>(obs => {
          let aborted = false;
          const args = ["-i","{in}","-af","equalizer=f=1000:width_type=h:width=200:g=-3"]; // Feature-specific FFmpeg args
          
          ffmpeg.processAudio(
            state.inputFile!,
            format,
            args,
            (p) => { if (!aborted) store.dispatch(EqualizerActions.updateProgress({ value: p })); }
          ).then(blob => {
            if (!aborted) {
              obs.next(EqualizerActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 }));
              obs.complete();
            }
          }).catch(err => {
            if (!aborted) {
              obs.next(EqualizerActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Validation failed or FFmpeg crashed', retryable: true }));
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
