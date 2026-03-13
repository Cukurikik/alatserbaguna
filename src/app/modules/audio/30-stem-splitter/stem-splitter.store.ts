import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface StemSplitterState {
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
const initialState: StemSplitterState = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,
};
export const StemSplitterActions = createActionGroup({
  source: '[StemSplitter]', events: {
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
export const stemSplitterReducer = createReducer(
  initialState,
  on(StemSplitterActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(StemSplitterActions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(StemSplitterActions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(StemSplitterActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(StemSplitterActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(StemSplitterActions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(StemSplitterActions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(StemSplitterActions.resetState, () => ({ ...initialState })),
);
export const selectStemSplitterState = createFeatureSelector<StemSplitterState>('stem-splitter');
export const selectStemSplitterStatus = createSelector(selectStemSplitterState, s => s.status);
export const selectStemSplitterInputFile = createSelector(selectStemSplitterState, s => s.inputFile);
export const selectStemSplitterAudioMeta = createSelector(selectStemSplitterState, s => s.audioMeta);
export const selectStemSplitterOutputBlob = createSelector(selectStemSplitterState, s => s.outputBlob);
export const selectStemSplitterOutputSizeMB = createSelector(selectStemSplitterState, s => s.outputSizeMB);
export const selectStemSplitterIsLoading = createSelector(selectStemSplitterState, s => s.status === 'loading' || s.status === 'processing');
export const selectStemSplitterIsDone = createSelector(selectStemSplitterState, s => s.status === 'done');
export const selectStemSplitterHasError = createSelector(selectStemSplitterState, s => s.status === 'error');
export const selectStemSplitterErrorMessage = createSelector(selectStemSplitterState, s => s.errorMessage);
export const selectStemSplitterRetryable = createSelector(selectStemSplitterState, s => s.retryable);
export const selectStemSplitterCanProcess = createSelector(selectStemSplitterState, s => !!s.inputFile && s.status === 'idle');

export const stemSplitterProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(StemSplitterActions.startProcessing),
      withLatestFrom(store.select(selectStemSplitterState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(StemSplitterActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(StemSplitterActions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(StemSplitterActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(StemSplitterActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);

export const stemsplitterReducer = stemSplitterReducer;
export const stemsplitterProcessingEffect = stemSplitterProcessingEffect;