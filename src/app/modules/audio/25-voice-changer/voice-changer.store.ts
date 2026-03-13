import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface VoiceChangerState {
  inputFile: File | null;
  audioMeta: AudioMeta | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}
const initialState: VoiceChangerState = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,
};
export const VoiceChangerActions = createActionGroup({
  source: '[VoiceChanger]', events: {
    'Load File': props<{ file: File }>(),
    'Load File Success': props<{ meta: AudioMeta }>(),
    'Load File Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Start Processing': props<{ format: ExportFormat }>(),
    'Update Progress': props<{ value: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string; retryable: boolean }>(),
    'Download Output': emptyProps(),
    'Reset State': emptyProps(),
  }
});
export const voiceChangerReducer = createReducer(
  initialState,
  on(VoiceChangerActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(VoiceChangerActions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(VoiceChangerActions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(VoiceChangerActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(VoiceChangerActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(VoiceChangerActions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(VoiceChangerActions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(VoiceChangerActions.resetState, () => ({ ...initialState })),
);
export const selectVoiceChangerState = createFeatureSelector<VoiceChangerState>('voice-changer');
export const selectVoiceChangerStatus = createSelector(selectVoiceChangerState, s => s.status);
export const selectVoiceChangerInputFile = createSelector(selectVoiceChangerState, s => s.inputFile);
export const selectVoiceChangerAudioMeta = createSelector(selectVoiceChangerState, s => s.audioMeta);
export const selectVoiceChangerOutputBlob = createSelector(selectVoiceChangerState, s => s.outputBlob);
export const selectVoiceChangerOutputSizeMB = createSelector(selectVoiceChangerState, s => s.outputSizeMB);
export const selectVoiceChangerIsLoading = createSelector(selectVoiceChangerState, s => s.status === 'loading' || s.status === 'processing');
export const selectVoiceChangerIsDone = createSelector(selectVoiceChangerState, s => s.status === 'done');
export const selectVoiceChangerHasError = createSelector(selectVoiceChangerState, s => s.status === 'error');
export const selectVoiceChangerErrorMessage = createSelector(selectVoiceChangerState, s => s.errorMessage);
export const selectVoiceChangerRetryable = createSelector(selectVoiceChangerState, s => s.retryable);
export const selectVoiceChangerCanProcess = createSelector(selectVoiceChangerState, s => !!s.inputFile && s.status === 'idle');

export const voiceChangerProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(VoiceChangerActions.startProcessing),
      withLatestFrom(store.select(selectVoiceChangerState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(VoiceChangerActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(VoiceChangerActions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(VoiceChangerActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(VoiceChangerActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);

export const voicechangerReducer = voiceChangerReducer;
export const voicechangerProcessingEffect = voiceChangerProcessingEffect;