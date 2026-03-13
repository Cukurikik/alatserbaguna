import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface BatchState {
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
const initialState: BatchState = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,
};
export const BatchActions = createActionGroup({
  source: '[Batch]', events: {
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
export const batchReducer = createReducer(
  initialState,
  on(BatchActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(BatchActions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(BatchActions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(BatchActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(BatchActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(BatchActions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(BatchActions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(BatchActions.resetState, () => ({ ...initialState })),
);
export const selectBatchState = createFeatureSelector<BatchState>('batch');
export const selectBatchStatus = createSelector(selectBatchState, s => s.status);
export const selectBatchInputFile = createSelector(selectBatchState, s => s.inputFile);
export const selectBatchAudioMeta = createSelector(selectBatchState, s => s.audioMeta);
export const selectBatchOutputBlob = createSelector(selectBatchState, s => s.outputBlob);
export const selectBatchOutputSizeMB = createSelector(selectBatchState, s => s.outputSizeMB);
export const selectBatchIsLoading = createSelector(selectBatchState, s => s.status === 'loading' || s.status === 'processing');
export const selectBatchIsDone = createSelector(selectBatchState, s => s.status === 'done');
export const selectBatchHasError = createSelector(selectBatchState, s => s.status === 'error');
export const selectBatchErrorMessage = createSelector(selectBatchState, s => s.errorMessage);
export const selectBatchRetryable = createSelector(selectBatchState, s => s.retryable);
export const selectBatchCanProcess = createSelector(selectBatchState, s => !!s.inputFile && s.status === 'idle');

export const batchProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(BatchActions.startProcessing),
      withLatestFrom(store.select(selectBatchState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(BatchActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(BatchActions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(BatchActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(BatchActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);
