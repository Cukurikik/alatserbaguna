import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

// ─── State ───────────────────────────────────────────────────────────────────
export interface TrimmerState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: TrimmerState = {
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
export const TrimmerActions = createActionGroup({
  source: '[Trimmer]',
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
export const trimmerReducer = createReducer(
  initialState,
  on(TrimmerActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'idle' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(TrimmerActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(TrimmerActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(TrimmerActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(TrimmerActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(TrimmerActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectTrimmerState = createFeatureSelector<TrimmerState>('trimmer');
export const selectTrimmerStatus = createSelector(selectTrimmerState, (s) => s.status);
export const selectTrimmerProgress = createSelector(selectTrimmerState, (s) => s.progress);
export const selectTrimmerOutputBlob = createSelector(selectTrimmerState, (s) => s.outputBlob);
export const selectTrimmerOutputSizeMB = createSelector(selectTrimmerState, (s) => s.outputSizeMB);
export const selectTrimmerErrorMessage = createSelector(selectTrimmerState, (s) => s.errorMessage);
export const selectTrimmerRetryable = createSelector(selectTrimmerState, (s) => s.retryable);
export const selectTrimmerInputFile = createSelector(selectTrimmerState, (s) => s.inputFile);

// ─── Effects ─────────────────────────────────────────────────────────────────
export const trimmerProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(TrimmerActions.startProcessing),
      withLatestFrom(store.select(selectTrimmerState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) {
          return of(TrimmerActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file selected', retryable: false }));
        }
        
        return new Observable<any>(obs => {
          let aborted = false;
          const args = ["-i","{in}","-ss","00:00:05","-t","00:00:15"]; // Feature-specific FFmpeg args
          
          ffmpeg.processAudio(
            state.inputFile!,
            format,
            args,
            (p) => { if (!aborted) store.dispatch(TrimmerActions.updateProgress({ value: p })); }
          ).then(blob => {
            if (!aborted) {
              obs.next(TrimmerActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 }));
              obs.complete();
            }
          }).catch(err => {
            if (!aborted) {
              obs.next(TrimmerActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Validation failed or FFmpeg crashed', retryable: true }));
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
