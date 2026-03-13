import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

// ─── State ───────────────────────────────────────────────────────────────────
export interface SilenceRemoverState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: SilenceRemoverState = {
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
export const SilenceRemoverActions = createActionGroup({
  source: '[SilenceRemover]',
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
export const silenceremoverReducer = createReducer(
  initialState,
  on(SilenceRemoverActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'idle' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(SilenceRemoverActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(SilenceRemoverActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(SilenceRemoverActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(SilenceRemoverActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(SilenceRemoverActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectSilenceRemoverState = createFeatureSelector<SilenceRemoverState>('silence-remover');
export const selectSilenceRemoverStatus = createSelector(selectSilenceRemoverState, (s) => s.status);
export const selectSilenceRemoverProgress = createSelector(selectSilenceRemoverState, (s) => s.progress);
export const selectSilenceRemoverOutputBlob = createSelector(selectSilenceRemoverState, (s) => s.outputBlob);
export const selectSilenceRemoverOutputSizeMB = createSelector(selectSilenceRemoverState, (s) => s.outputSizeMB);
export const selectSilenceRemoverErrorMessage = createSelector(selectSilenceRemoverState, (s) => s.errorMessage);
export const selectSilenceRemoverRetryable = createSelector(selectSilenceRemoverState, (s) => s.retryable);
export const selectSilenceRemoverInputFile = createSelector(selectSilenceRemoverState, (s) => s.inputFile);

// ─── Effects ─────────────────────────────────────────────────────────────────
export const silenceremoverProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(SilenceRemoverActions.startProcessing),
      withLatestFrom(store.select(selectSilenceRemoverState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) {
          return of(SilenceRemoverActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file selected', retryable: false }));
        }
        
        return new Observable<any>(obs => {
          let aborted = false;
          const args = ["-i","{in}","-af","silenceremove=stop_periods=-1:stop_duration=1:stop_threshold=-50dB"]; // Feature-specific FFmpeg args
          
          ffmpeg.processAudio(
            state.inputFile!,
            format,
            args,
            (p) => { if (!aborted) store.dispatch(SilenceRemoverActions.updateProgress({ value: p })); }
          ).then(blob => {
            if (!aborted) {
              obs.next(SilenceRemoverActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 }));
              obs.complete();
            }
          }).catch(err => {
            if (!aborted) {
              obs.next(SilenceRemoverActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Validation failed or FFmpeg crashed', retryable: true }));
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
