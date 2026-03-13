import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface ChannelMixerState {
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
const initialState: ChannelMixerState = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,
};
export const ChannelMixerActions = createActionGroup({
  source: '[ChannelMixer]', events: {
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
export const channelMixerReducer = createReducer(
  initialState,
  on(ChannelMixerActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(ChannelMixerActions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(ChannelMixerActions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(ChannelMixerActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(ChannelMixerActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(ChannelMixerActions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(ChannelMixerActions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(ChannelMixerActions.resetState, () => ({ ...initialState })),
);
export const selectChannelMixerState = createFeatureSelector<ChannelMixerState>('channel-mixer');
export const selectChannelMixerStatus = createSelector(selectChannelMixerState, s => s.status);
export const selectChannelMixerInputFile = createSelector(selectChannelMixerState, s => s.inputFile);
export const selectChannelMixerAudioMeta = createSelector(selectChannelMixerState, s => s.audioMeta);
export const selectChannelMixerOutputBlob = createSelector(selectChannelMixerState, s => s.outputBlob);
export const selectChannelMixerOutputSizeMB = createSelector(selectChannelMixerState, s => s.outputSizeMB);
export const selectChannelMixerIsLoading = createSelector(selectChannelMixerState, s => s.status === 'loading' || s.status === 'processing');
export const selectChannelMixerIsDone = createSelector(selectChannelMixerState, s => s.status === 'done');
export const selectChannelMixerHasError = createSelector(selectChannelMixerState, s => s.status === 'error');
export const selectChannelMixerErrorMessage = createSelector(selectChannelMixerState, s => s.errorMessage);
export const selectChannelMixerRetryable = createSelector(selectChannelMixerState, s => s.retryable);
export const selectChannelMixerCanProcess = createSelector(selectChannelMixerState, s => !!s.inputFile && s.status === 'idle');

export const channelMixerProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(ChannelMixerActions.startProcessing),
      withLatestFrom(store.select(selectChannelMixerState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(ChannelMixerActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(ChannelMixerActions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(ChannelMixerActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(ChannelMixerActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);

export const channelmixerReducer = channelMixerReducer;
export const channelmixerProcessingEffect = channelMixerProcessingEffect;