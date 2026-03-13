import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface WatermarkState {
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
const initialState: WatermarkState = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,
};
export const WatermarkActions = createActionGroup({
  source: '[Watermark]', events: {
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
export const watermarkReducer = createReducer(
  initialState,
  on(WatermarkActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(WatermarkActions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(WatermarkActions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(WatermarkActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(WatermarkActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(WatermarkActions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(WatermarkActions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(WatermarkActions.resetState, () => ({ ...initialState })),
);
export const selectWatermarkState = createFeatureSelector<WatermarkState>('watermark');
export const selectWatermarkStatus = createSelector(selectWatermarkState, s => s.status);
export const selectWatermarkInputFile = createSelector(selectWatermarkState, s => s.inputFile);
export const selectWatermarkAudioMeta = createSelector(selectWatermarkState, s => s.audioMeta);
export const selectWatermarkOutputBlob = createSelector(selectWatermarkState, s => s.outputBlob);
export const selectWatermarkOutputSizeMB = createSelector(selectWatermarkState, s => s.outputSizeMB);
export const selectWatermarkIsLoading = createSelector(selectWatermarkState, s => s.status === 'loading' || s.status === 'processing');
export const selectWatermarkIsDone = createSelector(selectWatermarkState, s => s.status === 'done');
export const selectWatermarkHasError = createSelector(selectWatermarkState, s => s.status === 'error');
export const selectWatermarkErrorMessage = createSelector(selectWatermarkState, s => s.errorMessage);
export const selectWatermarkRetryable = createSelector(selectWatermarkState, s => s.retryable);
export const selectWatermarkCanProcess = createSelector(selectWatermarkState, s => !!s.inputFile && s.status === 'idle');

export const watermarkProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(WatermarkActions.startProcessing),
      withLatestFrom(store.select(selectWatermarkState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(WatermarkActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(WatermarkActions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(WatermarkActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(WatermarkActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);
