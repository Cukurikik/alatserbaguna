import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

// ─── State ───────────────────────────────────────────────────────────────────
export interface VoiceChangerState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: VoiceChangerState = {
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
export const VoiceChangerActions = createActionGroup({
  source: '[VoiceChanger]',
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
export const voicechangerReducer = createReducer(
  initialState,
  on(VoiceChangerActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'idle' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(VoiceChangerActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(VoiceChangerActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(VoiceChangerActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(VoiceChangerActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(VoiceChangerActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectVoiceChangerState = createFeatureSelector<VoiceChangerState>('voice-changer');
export const selectVoiceChangerStatus = createSelector(selectVoiceChangerState, (s) => s.status);
export const selectVoiceChangerProgress = createSelector(selectVoiceChangerState, (s) => s.progress);
export const selectVoiceChangerOutputBlob = createSelector(selectVoiceChangerState, (s) => s.outputBlob);
export const selectVoiceChangerOutputSizeMB = createSelector(selectVoiceChangerState, (s) => s.outputSizeMB);
export const selectVoiceChangerErrorMessage = createSelector(selectVoiceChangerState, (s) => s.errorMessage);
export const selectVoiceChangerRetryable = createSelector(selectVoiceChangerState, (s) => s.retryable);
export const selectVoiceChangerInputFile = createSelector(selectVoiceChangerState, (s) => s.inputFile);

// ─── Effects ─────────────────────────────────────────────────────────────────
export const voicechangerProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(VoiceChangerActions.startProcessing),
      withLatestFrom(store.select(selectVoiceChangerState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) {
          return of(VoiceChangerActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file selected', retryable: false }));
        }
        
        return new Observable<any>(obs => {
          let aborted = false;
          const args = ["-i","{in}","-af","asetrate=44100*0.8,aresample=44100,aecho=0.8:0.9:1000:0.3"]; // Feature-specific FFmpeg args
          
          ffmpeg.processAudio(
            state.inputFile!,
            format,
            args,
            (p) => { if (!aborted) store.dispatch(VoiceChangerActions.updateProgress({ value: p })); }
          ).then(blob => {
            if (!aborted) {
              obs.next(VoiceChangerActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 }));
              obs.complete();
            }
          }).catch(err => {
            if (!aborted) {
              obs.next(VoiceChangerActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Validation failed or FFmpeg crashed', retryable: true }));
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
