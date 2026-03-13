import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface SplitterState {
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
const initialState: SplitterState = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,
};
export const SplitterActions = createActionGroup({
  source: '[Splitter]', events: {
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
export const splitterReducer = createReducer(
  initialState,
  on(SplitterActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(SplitterActions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(SplitterActions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(SplitterActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(SplitterActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(SplitterActions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(SplitterActions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(SplitterActions.resetState, () => ({ ...initialState })),
);
export const selectSplitterState = createFeatureSelector<SplitterState>('splitter');
export const selectSplitterStatus = createSelector(selectSplitterState, s => s.status);
export const selectSplitterInputFile = createSelector(selectSplitterState, s => s.inputFile);
export const selectSplitterAudioMeta = createSelector(selectSplitterState, s => s.audioMeta);
export const selectSplitterOutputBlob = createSelector(selectSplitterState, s => s.outputBlob);
export const selectSplitterOutputSizeMB = createSelector(selectSplitterState, s => s.outputSizeMB);
export const selectSplitterIsLoading = createSelector(selectSplitterState, s => s.status === 'loading' || s.status === 'processing');
export const selectSplitterIsDone = createSelector(selectSplitterState, s => s.status === 'done');
export const selectSplitterHasError = createSelector(selectSplitterState, s => s.status === 'error');
export const selectSplitterErrorMessage = createSelector(selectSplitterState, s => s.errorMessage);
export const selectSplitterRetryable = createSelector(selectSplitterState, s => s.retryable);
export const selectSplitterCanProcess = createSelector(selectSplitterState, s => !!s.inputFile && s.status === 'idle');

export const splitterProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(SplitterActions.startProcessing),
      withLatestFrom(store.select(selectSplitterState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(SplitterActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(SplitterActions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(SplitterActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(SplitterActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);
