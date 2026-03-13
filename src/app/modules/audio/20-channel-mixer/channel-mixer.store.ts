import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

// ─── State ───────────────────────────────────────────────────────────────────
export interface ChannelMixerState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: ChannelMixerState = {
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
export const ChannelMixerActions = createActionGroup({
  source: '[ChannelMixer]',
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
export const channelmixerReducer = createReducer(
  initialState,
  on(ChannelMixerActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'idle' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(ChannelMixerActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(ChannelMixerActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(ChannelMixerActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(ChannelMixerActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(ChannelMixerActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectChannelMixerState = createFeatureSelector<ChannelMixerState>('channel-mixer');
export const selectChannelMixerStatus = createSelector(selectChannelMixerState, (s) => s.status);
export const selectChannelMixerProgress = createSelector(selectChannelMixerState, (s) => s.progress);
export const selectChannelMixerOutputBlob = createSelector(selectChannelMixerState, (s) => s.outputBlob);
export const selectChannelMixerOutputSizeMB = createSelector(selectChannelMixerState, (s) => s.outputSizeMB);
export const selectChannelMixerErrorMessage = createSelector(selectChannelMixerState, (s) => s.errorMessage);
export const selectChannelMixerRetryable = createSelector(selectChannelMixerState, (s) => s.retryable);
export const selectChannelMixerInputFile = createSelector(selectChannelMixerState, (s) => s.inputFile);

// ─── Effects ─────────────────────────────────────────────────────────────────
export const channelmixerProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(ChannelMixerActions.startProcessing),
      withLatestFrom(store.select(selectChannelMixerState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) {
          return of(ChannelMixerActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file selected', retryable: false }));
        }
        
        return new Observable<any>(obs => {
          let aborted = false;
          const args = ["-i","{in}","-ac","1"]; // Feature-specific FFmpeg args
          
          ffmpeg.processAudio(
            state.inputFile!,
            format,
            args,
            (p) => { if (!aborted) store.dispatch(ChannelMixerActions.updateProgress({ value: p })); }
          ).then(blob => {
            if (!aborted) {
              obs.next(ChannelMixerActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 }));
              obs.complete();
            }
          }).catch(err => {
            if (!aborted) {
              obs.next(ChannelMixerActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Validation failed or FFmpeg crashed', retryable: true }));
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
