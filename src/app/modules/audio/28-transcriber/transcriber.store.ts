import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

// ─── State ───────────────────────────────────────────────────────────────────
export interface TranscriberState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: TranscriberState = {
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
export const TranscriberActions = createActionGroup({
  source: '[Transcriber]',
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
export const transcriberReducer = createReducer(
  initialState,
  on(TranscriberActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'idle' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(TranscriberActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(TranscriberActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(TranscriberActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(TranscriberActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(TranscriberActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectTranscriberState = createFeatureSelector<TranscriberState>('transcriber');
export const selectTranscriberStatus = createSelector(selectTranscriberState, (s) => s.status);
export const selectTranscriberProgress = createSelector(selectTranscriberState, (s) => s.progress);
export const selectTranscriberOutputBlob = createSelector(selectTranscriberState, (s) => s.outputBlob);
export const selectTranscriberOutputSizeMB = createSelector(selectTranscriberState, (s) => s.outputSizeMB);
export const selectTranscriberErrorMessage = createSelector(selectTranscriberState, (s) => s.errorMessage);
export const selectTranscriberRetryable = createSelector(selectTranscriberState, (s) => s.retryable);
export const selectTranscriberInputFile = createSelector(selectTranscriberState, (s) => s.inputFile);

// ─── Effects ─────────────────────────────────────────────────────────────────
export const transcriberProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(TranscriberActions.startProcessing),
      withLatestFrom(store.select(selectTranscriberState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) {
          return of(TranscriberActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file selected', retryable: false }));
        }
        
        return new Observable<any>(obs => {
          let aborted = false;
          const args = ["-i","{in}"]; // Feature-specific FFmpeg args
          
          ffmpeg.processAudio(
            state.inputFile!,
            format,
            args,
            (p) => { if (!aborted) store.dispatch(TranscriberActions.updateProgress({ value: p })); }
          ).then(blob => {
            if (!aborted) {
              obs.next(TranscriberActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 }));
              obs.complete();
            }
          }).catch(err => {
            if (!aborted) {
              obs.next(TranscriberActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Validation failed or FFmpeg crashed', retryable: true }));
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
