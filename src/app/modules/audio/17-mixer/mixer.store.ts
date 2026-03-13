import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface MixerState {
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
const initialState: MixerState = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,
};
export const MixerActions = createActionGroup({
  source: '[Mixer]', events: {
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
export const mixerReducer = createReducer(
  initialState,
  on(MixerActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(MixerActions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(MixerActions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(MixerActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(MixerActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(MixerActions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(MixerActions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(MixerActions.resetState, () => ({ ...initialState })),
);
export const selectMixerState = createFeatureSelector<MixerState>('mixer');
export const selectMixerStatus = createSelector(selectMixerState, s => s.status);
export const selectMixerInputFile = createSelector(selectMixerState, s => s.inputFile);
export const selectMixerAudioMeta = createSelector(selectMixerState, s => s.audioMeta);
export const selectMixerOutputBlob = createSelector(selectMixerState, s => s.outputBlob);
export const selectMixerOutputSizeMB = createSelector(selectMixerState, s => s.outputSizeMB);
export const selectMixerIsLoading = createSelector(selectMixerState, s => s.status === 'loading' || s.status === 'processing');
export const selectMixerIsDone = createSelector(selectMixerState, s => s.status === 'done');
export const selectMixerHasError = createSelector(selectMixerState, s => s.status === 'error');
export const selectMixerErrorMessage = createSelector(selectMixerState, s => s.errorMessage);
export const selectMixerRetryable = createSelector(selectMixerState, s => s.retryable);
export const selectMixerCanProcess = createSelector(selectMixerState, s => !!s.inputFile && s.status === 'idle');

export const mixerProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(MixerActions.startProcessing),
      withLatestFrom(store.select(selectMixerState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(MixerActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(MixerActions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(MixerActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(MixerActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);
