import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface AnalyserState {
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
const initialState: AnalyserState = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,
};
export const AnalyserActions = createActionGroup({
  source: '[Analyser]', events: {
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
export const analyserReducer = createReducer(
  initialState,
  on(AnalyserActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(AnalyserActions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(AnalyserActions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(AnalyserActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(AnalyserActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(AnalyserActions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(AnalyserActions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(AnalyserActions.resetState, () => ({ ...initialState })),
);
export const selectAnalyserState = createFeatureSelector<AnalyserState>('analyser');
export const selectAnalyserStatus = createSelector(selectAnalyserState, s => s.status);
export const selectAnalyserInputFile = createSelector(selectAnalyserState, s => s.inputFile);
export const selectAnalyserAudioMeta = createSelector(selectAnalyserState, s => s.audioMeta);
export const selectAnalyserOutputBlob = createSelector(selectAnalyserState, s => s.outputBlob);
export const selectAnalyserOutputSizeMB = createSelector(selectAnalyserState, s => s.outputSizeMB);
export const selectAnalyserIsLoading = createSelector(selectAnalyserState, s => s.status === 'loading' || s.status === 'processing');
export const selectAnalyserIsDone = createSelector(selectAnalyserState, s => s.status === 'done');
export const selectAnalyserHasError = createSelector(selectAnalyserState, s => s.status === 'error');
export const selectAnalyserErrorMessage = createSelector(selectAnalyserState, s => s.errorMessage);
export const selectAnalyserRetryable = createSelector(selectAnalyserState, s => s.retryable);
export const selectAnalyserCanProcess = createSelector(selectAnalyserState, s => !!s.inputFile && s.status === 'idle');

export const analyserProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(AnalyserActions.startProcessing),
      withLatestFrom(store.select(selectAnalyserState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(AnalyserActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(AnalyserActions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(AnalyserActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(AnalyserActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);
