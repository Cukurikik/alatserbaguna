import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

// ─── State ───────────────────────────────────────────────────────────────────
export interface TimeStretchState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: TimeStretchState = {
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
export const TimeStretchActions = createActionGroup({
  source: '[TimeStretch]',
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
export const timestretchReducer = createReducer(
  initialState,
  on(TimeStretchActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'idle' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(TimeStretchActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(TimeStretchActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(TimeStretchActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(TimeStretchActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(TimeStretchActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectTimeStretchState = createFeatureSelector<TimeStretchState>('time-stretch');
export const selectTimeStretchStatus = createSelector(selectTimeStretchState, (s) => s.status);
export const selectTimeStretchProgress = createSelector(selectTimeStretchState, (s) => s.progress);
export const selectTimeStretchOutputBlob = createSelector(selectTimeStretchState, (s) => s.outputBlob);
export const selectTimeStretchOutputSizeMB = createSelector(selectTimeStretchState, (s) => s.outputSizeMB);
export const selectTimeStretchErrorMessage = createSelector(selectTimeStretchState, (s) => s.errorMessage);
export const selectTimeStretchRetryable = createSelector(selectTimeStretchState, (s) => s.retryable);
export const selectTimeStretchInputFile = createSelector(selectTimeStretchState, (s) => s.inputFile);

// ─── Effects ─────────────────────────────────────────────────────────────────
export const timestretchProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(TimeStretchActions.startProcessing),
      withLatestFrom(store.select(selectTimeStretchState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) {
          return of(TimeStretchActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file selected', retryable: false }));
        }
        
        return new Observable<any>(obs => {
          let aborted = false;
          const args = ["-i","{in}","-af","atempo=1.5"]; // Feature-specific FFmpeg args
          
          ffmpeg.processAudio(
            state.inputFile!,
            format,
            args,
            (p) => { if (!aborted) store.dispatch(TimeStretchActions.updateProgress({ value: p })); }
          ).then(blob => {
            if (!aborted) {
              obs.next(TimeStretchActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 }));
              obs.complete();
            }
          }).catch(err => {
            if (!aborted) {
              obs.next(TimeStretchActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Validation failed or FFmpeg crashed', retryable: true }));
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
