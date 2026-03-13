import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface TranscriberState {
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
const initialState: TranscriberState = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,
};
export const TranscriberActions = createActionGroup({
  source: '[Transcriber]', events: {
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
export const transcriberReducer = createReducer(
  initialState,
  on(TranscriberActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(TranscriberActions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(TranscriberActions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(TranscriberActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(TranscriberActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(TranscriberActions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(TranscriberActions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(TranscriberActions.resetState, () => ({ ...initialState })),
);
export const selectTranscriberState = createFeatureSelector<TranscriberState>('transcriber');
export const selectTranscriberStatus = createSelector(selectTranscriberState, s => s.status);
export const selectTranscriberInputFile = createSelector(selectTranscriberState, s => s.inputFile);
export const selectTranscriberAudioMeta = createSelector(selectTranscriberState, s => s.audioMeta);
export const selectTranscriberOutputBlob = createSelector(selectTranscriberState, s => s.outputBlob);
export const selectTranscriberOutputSizeMB = createSelector(selectTranscriberState, s => s.outputSizeMB);
export const selectTranscriberIsLoading = createSelector(selectTranscriberState, s => s.status === 'loading' || s.status === 'processing');
export const selectTranscriberIsDone = createSelector(selectTranscriberState, s => s.status === 'done');
export const selectTranscriberHasError = createSelector(selectTranscriberState, s => s.status === 'error');
export const selectTranscriberErrorMessage = createSelector(selectTranscriberState, s => s.errorMessage);
export const selectTranscriberRetryable = createSelector(selectTranscriberState, s => s.retryable);
export const selectTranscriberCanProcess = createSelector(selectTranscriberState, s => !!s.inputFile && s.status === 'idle');

export const transcriberProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(TranscriberActions.startProcessing),
      withLatestFrom(store.select(selectTranscriberState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(TranscriberActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(TranscriberActions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(TranscriberActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(TranscriberActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);
