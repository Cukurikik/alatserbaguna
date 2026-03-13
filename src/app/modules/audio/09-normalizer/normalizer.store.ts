import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface NormalizerState {
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
const initialState: NormalizerState = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,
};
export const NormalizerActions = createActionGroup({
  source: '[Normalizer]', events: {
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
export const normalizerReducer = createReducer(
  initialState,
  on(NormalizerActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(NormalizerActions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(NormalizerActions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(NormalizerActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(NormalizerActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(NormalizerActions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(NormalizerActions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(NormalizerActions.resetState, () => ({ ...initialState })),
);
export const selectNormalizerState = createFeatureSelector<NormalizerState>('normalizer');
export const selectNormalizerStatus = createSelector(selectNormalizerState, s => s.status);
export const selectNormalizerInputFile = createSelector(selectNormalizerState, s => s.inputFile);
export const selectNormalizerAudioMeta = createSelector(selectNormalizerState, s => s.audioMeta);
export const selectNormalizerOutputBlob = createSelector(selectNormalizerState, s => s.outputBlob);
export const selectNormalizerOutputSizeMB = createSelector(selectNormalizerState, s => s.outputSizeMB);
export const selectNormalizerIsLoading = createSelector(selectNormalizerState, s => s.status === 'loading' || s.status === 'processing');
export const selectNormalizerIsDone = createSelector(selectNormalizerState, s => s.status === 'done');
export const selectNormalizerHasError = createSelector(selectNormalizerState, s => s.status === 'error');
export const selectNormalizerErrorMessage = createSelector(selectNormalizerState, s => s.errorMessage);
export const selectNormalizerRetryable = createSelector(selectNormalizerState, s => s.retryable);
export const selectNormalizerCanProcess = createSelector(selectNormalizerState, s => !!s.inputFile && s.status === 'idle');

export const normalizerProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(NormalizerActions.startProcessing),
      withLatestFrom(store.select(selectNormalizerState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(NormalizerActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(NormalizerActions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(NormalizerActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(NormalizerActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);
