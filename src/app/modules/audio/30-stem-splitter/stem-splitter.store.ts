import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

// ─── State ───────────────────────────────────────────────────────────────────
export interface StemSplitterState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: StemSplitterState = {
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
export const StemSplitterActions = createActionGroup({
  source: '[StemSplitter]',
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
export const stemsplitterReducer = createReducer(
  initialState,
  on(StemSplitterActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'idle' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(StemSplitterActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(StemSplitterActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(StemSplitterActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(StemSplitterActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(StemSplitterActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectStemSplitterState = createFeatureSelector<StemSplitterState>('stem-splitter');
export const selectStemSplitterStatus = createSelector(selectStemSplitterState, (s) => s.status);
export const selectStemSplitterProgress = createSelector(selectStemSplitterState, (s) => s.progress);
export const selectStemSplitterOutputBlob = createSelector(selectStemSplitterState, (s) => s.outputBlob);
export const selectStemSplitterOutputSizeMB = createSelector(selectStemSplitterState, (s) => s.outputSizeMB);
export const selectStemSplitterErrorMessage = createSelector(selectStemSplitterState, (s) => s.errorMessage);
export const selectStemSplitterRetryable = createSelector(selectStemSplitterState, (s) => s.retryable);
export const selectStemSplitterInputFile = createSelector(selectStemSplitterState, (s) => s.inputFile);

// ─── Effects ─────────────────────────────────────────────────────────────────
export const stemsplitterProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(StemSplitterActions.startProcessing),
      withLatestFrom(store.select(selectStemSplitterState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) {
          return of(StemSplitterActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file selected', retryable: false }));
        }
        
        return new Observable<any>(obs => {
          let aborted = false;
          const args = ["-i","{in}"]; // Feature-specific FFmpeg args
          
          ffmpeg.processAudio(
            state.inputFile!,
            format,
            args,
            (p) => { if (!aborted) store.dispatch(StemSplitterActions.updateProgress({ value: p })); }
          ).then(blob => {
            if (!aborted) {
              obs.next(StemSplitterActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 }));
              obs.complete();
            }
          }).catch(err => {
            if (!aborted) {
              obs.next(StemSplitterActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Validation failed or FFmpeg crashed', retryable: true }));
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
