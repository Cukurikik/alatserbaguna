import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface LooperState {
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
const initialState: LooperState = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,
};
export const LooperActions = createActionGroup({
  source: '[Looper]', events: {
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
export const looperReducer = createReducer(
  initialState,
  on(LooperActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(LooperActions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(LooperActions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(LooperActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(LooperActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(LooperActions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(LooperActions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(LooperActions.resetState, () => ({ ...initialState })),
);
export const selectLooperState = createFeatureSelector<LooperState>('looper');
export const selectLooperStatus = createSelector(selectLooperState, s => s.status);
export const selectLooperInputFile = createSelector(selectLooperState, s => s.inputFile);
export const selectLooperAudioMeta = createSelector(selectLooperState, s => s.audioMeta);
export const selectLooperOutputBlob = createSelector(selectLooperState, s => s.outputBlob);
export const selectLooperOutputSizeMB = createSelector(selectLooperState, s => s.outputSizeMB);
export const selectLooperIsLoading = createSelector(selectLooperState, s => s.status === 'loading' || s.status === 'processing');
export const selectLooperIsDone = createSelector(selectLooperState, s => s.status === 'done');
export const selectLooperHasError = createSelector(selectLooperState, s => s.status === 'error');
export const selectLooperErrorMessage = createSelector(selectLooperState, s => s.errorMessage);
export const selectLooperRetryable = createSelector(selectLooperState, s => s.retryable);
export const selectLooperCanProcess = createSelector(selectLooperState, s => !!s.inputFile && s.status === 'idle');

export const looperProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(LooperActions.startProcessing),
      withLatestFrom(store.select(selectLooperState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(LooperActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(LooperActions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(LooperActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(LooperActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);
