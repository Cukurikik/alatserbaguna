import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface RecorderState {
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
const initialState: RecorderState = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,
};
export const RecorderActions = createActionGroup({
  source: '[Recorder]', events: {
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
export const recorderReducer = createReducer(
  initialState,
  on(RecorderActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(RecorderActions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(RecorderActions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(RecorderActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(RecorderActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(RecorderActions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(RecorderActions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(RecorderActions.resetState, () => ({ ...initialState })),
);
export const selectRecorderState = createFeatureSelector<RecorderState>('recorder');
export const selectRecorderStatus = createSelector(selectRecorderState, s => s.status);
export const selectRecorderInputFile = createSelector(selectRecorderState, s => s.inputFile);
export const selectRecorderAudioMeta = createSelector(selectRecorderState, s => s.audioMeta);
export const selectRecorderOutputBlob = createSelector(selectRecorderState, s => s.outputBlob);
export const selectRecorderOutputSizeMB = createSelector(selectRecorderState, s => s.outputSizeMB);
export const selectRecorderIsLoading = createSelector(selectRecorderState, s => s.status === 'loading' || s.status === 'processing');
export const selectRecorderIsDone = createSelector(selectRecorderState, s => s.status === 'done');
export const selectRecorderHasError = createSelector(selectRecorderState, s => s.status === 'error');
export const selectRecorderErrorMessage = createSelector(selectRecorderState, s => s.errorMessage);
export const selectRecorderRetryable = createSelector(selectRecorderState, s => s.retryable);
export const selectRecorderCanProcess = createSelector(selectRecorderState, s => !!s.inputFile && s.status === 'idle');

export const recorderProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(RecorderActions.startProcessing),
      withLatestFrom(store.select(selectRecorderState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(RecorderActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(RecorderActions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(RecorderActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(RecorderActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);
