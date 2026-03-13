import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface TrimmerState {
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
const initialState: TrimmerState = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,
};
export const TrimmerActions = createActionGroup({
  source: '[Trimmer]', events: {
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
export const trimmerReducer = createReducer(
  initialState,
  on(TrimmerActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(TrimmerActions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(TrimmerActions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(TrimmerActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(TrimmerActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(TrimmerActions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(TrimmerActions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(TrimmerActions.resetState, () => ({ ...initialState })),
);
export const selectTrimmerState = createFeatureSelector<TrimmerState>('trimmer');
export const selectTrimmerStatus = createSelector(selectTrimmerState, s => s.status);
export const selectTrimmerInputFile = createSelector(selectTrimmerState, s => s.inputFile);
export const selectTrimmerAudioMeta = createSelector(selectTrimmerState, s => s.audioMeta);
export const selectTrimmerOutputBlob = createSelector(selectTrimmerState, s => s.outputBlob);
export const selectTrimmerOutputSizeMB = createSelector(selectTrimmerState, s => s.outputSizeMB);
export const selectTrimmerIsLoading = createSelector(selectTrimmerState, s => s.status === 'loading' || s.status === 'processing');
export const selectTrimmerIsDone = createSelector(selectTrimmerState, s => s.status === 'done');
export const selectTrimmerHasError = createSelector(selectTrimmerState, s => s.status === 'error');
export const selectTrimmerErrorMessage = createSelector(selectTrimmerState, s => s.errorMessage);
export const selectTrimmerRetryable = createSelector(selectTrimmerState, s => s.retryable);
export const selectTrimmerCanProcess = createSelector(selectTrimmerState, s => !!s.inputFile && s.status === 'idle');

export const trimmerProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(TrimmerActions.startProcessing),
      withLatestFrom(store.select(selectTrimmerState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(TrimmerActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(TrimmerActions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(TrimmerActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(TrimmerActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);
