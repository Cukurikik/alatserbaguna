import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface SpeedState {
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
const initialState: SpeedState = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,
};
export const SpeedActions = createActionGroup({
  source: '[Speed]', events: {
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
export const speedReducer = createReducer(
  initialState,
  on(SpeedActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(SpeedActions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(SpeedActions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(SpeedActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(SpeedActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(SpeedActions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(SpeedActions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(SpeedActions.resetState, () => ({ ...initialState })),
);
export const selectSpeedState = createFeatureSelector<SpeedState>('speed');
export const selectSpeedStatus = createSelector(selectSpeedState, s => s.status);
export const selectSpeedInputFile = createSelector(selectSpeedState, s => s.inputFile);
export const selectSpeedAudioMeta = createSelector(selectSpeedState, s => s.audioMeta);
export const selectSpeedOutputBlob = createSelector(selectSpeedState, s => s.outputBlob);
export const selectSpeedOutputSizeMB = createSelector(selectSpeedState, s => s.outputSizeMB);
export const selectSpeedIsLoading = createSelector(selectSpeedState, s => s.status === 'loading' || s.status === 'processing');
export const selectSpeedIsDone = createSelector(selectSpeedState, s => s.status === 'done');
export const selectSpeedHasError = createSelector(selectSpeedState, s => s.status === 'error');
export const selectSpeedErrorMessage = createSelector(selectSpeedState, s => s.errorMessage);
export const selectSpeedRetryable = createSelector(selectSpeedState, s => s.retryable);
export const selectSpeedCanProcess = createSelector(selectSpeedState, s => !!s.inputFile && s.status === 'idle');

export const speedProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(SpeedActions.startProcessing),
      withLatestFrom(store.select(selectSpeedState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(SpeedActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(SpeedActions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(SpeedActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(SpeedActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);
