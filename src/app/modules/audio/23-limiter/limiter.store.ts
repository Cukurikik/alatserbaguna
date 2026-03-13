import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface LimiterState {
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
const initialState: LimiterState = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,
};
export const LimiterActions = createActionGroup({
  source: '[Limiter]', events: {
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
export const limiterReducer = createReducer(
  initialState,
  on(LimiterActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(LimiterActions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(LimiterActions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(LimiterActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(LimiterActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(LimiterActions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(LimiterActions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(LimiterActions.resetState, () => ({ ...initialState })),
);
export const selectLimiterState = createFeatureSelector<LimiterState>('limiter');
export const selectLimiterStatus = createSelector(selectLimiterState, s => s.status);
export const selectLimiterInputFile = createSelector(selectLimiterState, s => s.inputFile);
export const selectLimiterAudioMeta = createSelector(selectLimiterState, s => s.audioMeta);
export const selectLimiterOutputBlob = createSelector(selectLimiterState, s => s.outputBlob);
export const selectLimiterOutputSizeMB = createSelector(selectLimiterState, s => s.outputSizeMB);
export const selectLimiterIsLoading = createSelector(selectLimiterState, s => s.status === 'loading' || s.status === 'processing');
export const selectLimiterIsDone = createSelector(selectLimiterState, s => s.status === 'done');
export const selectLimiterHasError = createSelector(selectLimiterState, s => s.status === 'error');
export const selectLimiterErrorMessage = createSelector(selectLimiterState, s => s.errorMessage);
export const selectLimiterRetryable = createSelector(selectLimiterState, s => s.retryable);
export const selectLimiterCanProcess = createSelector(selectLimiterState, s => !!s.inputFile && s.status === 'idle');

export const limiterProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(LimiterActions.startProcessing),
      withLatestFrom(store.select(selectLimiterState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(LimiterActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(LimiterActions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(LimiterActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(LimiterActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);
