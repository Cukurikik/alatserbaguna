import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface ConverterState {
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
const initialState: ConverterState = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,
};
export const ConverterActions = createActionGroup({
  source: '[Converter]', events: {
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
export const converterReducer = createReducer(
  initialState,
  on(ConverterActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(ConverterActions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(ConverterActions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(ConverterActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(ConverterActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(ConverterActions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(ConverterActions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(ConverterActions.resetState, () => ({ ...initialState })),
);
export const selectConverterState = createFeatureSelector<ConverterState>('converter');
export const selectConverterStatus = createSelector(selectConverterState, s => s.status);
export const selectConverterInputFile = createSelector(selectConverterState, s => s.inputFile);
export const selectConverterAudioMeta = createSelector(selectConverterState, s => s.audioMeta);
export const selectConverterOutputBlob = createSelector(selectConverterState, s => s.outputBlob);
export const selectConverterOutputSizeMB = createSelector(selectConverterState, s => s.outputSizeMB);
export const selectConverterIsLoading = createSelector(selectConverterState, s => s.status === 'loading' || s.status === 'processing');
export const selectConverterIsDone = createSelector(selectConverterState, s => s.status === 'done');
export const selectConverterHasError = createSelector(selectConverterState, s => s.status === 'error');
export const selectConverterErrorMessage = createSelector(selectConverterState, s => s.errorMessage);
export const selectConverterRetryable = createSelector(selectConverterState, s => s.retryable);
export const selectConverterCanProcess = createSelector(selectConverterState, s => !!s.inputFile && s.status === 'idle');

export const converterProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(ConverterActions.startProcessing),
      withLatestFrom(store.select(selectConverterState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(ConverterActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(ConverterActions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(ConverterActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(ConverterActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);
