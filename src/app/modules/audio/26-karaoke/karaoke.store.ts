import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

// ─── State ───────────────────────────────────────────────────────────────────
export interface KaraokeState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: KaraokeState = {
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
export const KaraokeActions = createActionGroup({
  source: '[Karaoke]',
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
export const karaokeReducer = createReducer(
  initialState,
  on(KaraokeActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'idle' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(KaraokeActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(KaraokeActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(KaraokeActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(KaraokeActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(KaraokeActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectKaraokeState = createFeatureSelector<KaraokeState>('karaoke');
export const selectKaraokeStatus = createSelector(selectKaraokeState, (s) => s.status);
export const selectKaraokeProgress = createSelector(selectKaraokeState, (s) => s.progress);
export const selectKaraokeOutputBlob = createSelector(selectKaraokeState, (s) => s.outputBlob);
export const selectKaraokeOutputSizeMB = createSelector(selectKaraokeState, (s) => s.outputSizeMB);
export const selectKaraokeErrorMessage = createSelector(selectKaraokeState, (s) => s.errorMessage);
export const selectKaraokeRetryable = createSelector(selectKaraokeState, (s) => s.retryable);
export const selectKaraokeInputFile = createSelector(selectKaraokeState, (s) => s.inputFile);

// ─── Effects ─────────────────────────────────────────────────────────────────
export const karaokeProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(KaraokeActions.startProcessing),
      withLatestFrom(store.select(selectKaraokeState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) {
          return of(KaraokeActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file selected', retryable: false }));
        }
        
        return new Observable<any>(obs => {
          let aborted = false;
          const args = ["-i","{in}","-af","pan=stereo|c0=c0-c1|c1=c0-c1"]; // Feature-specific FFmpeg args
          
          ffmpeg.processAudio(
            state.inputFile!,
            format,
            args,
            (p) => { if (!aborted) store.dispatch(KaraokeActions.updateProgress({ value: p })); }
          ).then(blob => {
            if (!aborted) {
              obs.next(KaraokeActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 }));
              obs.complete();
            }
          }).catch(err => {
            if (!aborted) {
              obs.next(KaraokeActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Validation failed or FFmpeg crashed', retryable: true }));
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
