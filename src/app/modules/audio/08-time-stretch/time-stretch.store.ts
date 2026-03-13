import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface TimeStretchState {
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
const initialState: TimeStretchState = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,
};
export const TimeStretchActions = createActionGroup({
  source: '[TimeStretch]', events: {
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
export const timeStretchReducer = createReducer(
  initialState,
  on(TimeStretchActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(TimeStretchActions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(TimeStretchActions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(TimeStretchActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(TimeStretchActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(TimeStretchActions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(TimeStretchActions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(TimeStretchActions.resetState, () => ({ ...initialState })),
);
export const selectTimeStretchState = createFeatureSelector<TimeStretchState>('time-stretch');
export const selectTimeStretchStatus = createSelector(selectTimeStretchState, s => s.status);
export const selectTimeStretchInputFile = createSelector(selectTimeStretchState, s => s.inputFile);
export const selectTimeStretchAudioMeta = createSelector(selectTimeStretchState, s => s.audioMeta);
export const selectTimeStretchOutputBlob = createSelector(selectTimeStretchState, s => s.outputBlob);
export const selectTimeStretchOutputSizeMB = createSelector(selectTimeStretchState, s => s.outputSizeMB);
export const selectTimeStretchIsLoading = createSelector(selectTimeStretchState, s => s.status === 'loading' || s.status === 'processing');
export const selectTimeStretchIsDone = createSelector(selectTimeStretchState, s => s.status === 'done');
export const selectTimeStretchHasError = createSelector(selectTimeStretchState, s => s.status === 'error');
export const selectTimeStretchErrorMessage = createSelector(selectTimeStretchState, s => s.errorMessage);
export const selectTimeStretchRetryable = createSelector(selectTimeStretchState, s => s.retryable);
export const selectTimeStretchCanProcess = createSelector(selectTimeStretchState, s => !!s.inputFile && s.status === 'idle');

export const timeStretchProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(TimeStretchActions.startProcessing),
      withLatestFrom(store.select(selectTimeStretchState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(TimeStretchActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(TimeStretchActions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(TimeStretchActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(TimeStretchActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);

export const timestretchReducer = timeStretchReducer;
export const timestretchProcessingEffect = timeStretchProcessingEffect;