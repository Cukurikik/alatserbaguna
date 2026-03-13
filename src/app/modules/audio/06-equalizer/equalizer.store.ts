import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface EqualizerState {
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
const initialState: EqualizerState = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,
};
export const EqualizerActions = createActionGroup({
  source: '[Equalizer]', events: {
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
export const equalizerReducer = createReducer(
  initialState,
  on(EqualizerActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(EqualizerActions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(EqualizerActions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(EqualizerActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(EqualizerActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(EqualizerActions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(EqualizerActions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(EqualizerActions.resetState, () => ({ ...initialState })),
);
export const selectEqualizerState = createFeatureSelector<EqualizerState>('equalizer');
export const selectEqualizerStatus = createSelector(selectEqualizerState, s => s.status);
export const selectEqualizerInputFile = createSelector(selectEqualizerState, s => s.inputFile);
export const selectEqualizerAudioMeta = createSelector(selectEqualizerState, s => s.audioMeta);
export const selectEqualizerOutputBlob = createSelector(selectEqualizerState, s => s.outputBlob);
export const selectEqualizerOutputSizeMB = createSelector(selectEqualizerState, s => s.outputSizeMB);
export const selectEqualizerIsLoading = createSelector(selectEqualizerState, s => s.status === 'loading' || s.status === 'processing');
export const selectEqualizerIsDone = createSelector(selectEqualizerState, s => s.status === 'done');
export const selectEqualizerHasError = createSelector(selectEqualizerState, s => s.status === 'error');
export const selectEqualizerErrorMessage = createSelector(selectEqualizerState, s => s.errorMessage);
export const selectEqualizerRetryable = createSelector(selectEqualizerState, s => s.retryable);
export const selectEqualizerCanProcess = createSelector(selectEqualizerState, s => !!s.inputFile && s.status === 'idle');

export const equalizerProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(EqualizerActions.startProcessing),
      withLatestFrom(store.select(selectEqualizerState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(EqualizerActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(EqualizerActions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(EqualizerActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(EqualizerActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);
