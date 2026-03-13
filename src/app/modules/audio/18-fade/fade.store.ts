import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface FadeState {
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
const initialState: FadeState = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,
};
export const FadeActions = createActionGroup({
  source: '[Fade]', events: {
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
export const fadeReducer = createReducer(
  initialState,
  on(FadeActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(FadeActions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(FadeActions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(FadeActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(FadeActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(FadeActions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(FadeActions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(FadeActions.resetState, () => ({ ...initialState })),
);
export const selectFadeState = createFeatureSelector<FadeState>('fade');
export const selectFadeStatus = createSelector(selectFadeState, s => s.status);
export const selectFadeInputFile = createSelector(selectFadeState, s => s.inputFile);
export const selectFadeAudioMeta = createSelector(selectFadeState, s => s.audioMeta);
export const selectFadeOutputBlob = createSelector(selectFadeState, s => s.outputBlob);
export const selectFadeOutputSizeMB = createSelector(selectFadeState, s => s.outputSizeMB);
export const selectFadeIsLoading = createSelector(selectFadeState, s => s.status === 'loading' || s.status === 'processing');
export const selectFadeIsDone = createSelector(selectFadeState, s => s.status === 'done');
export const selectFadeHasError = createSelector(selectFadeState, s => s.status === 'error');
export const selectFadeErrorMessage = createSelector(selectFadeState, s => s.errorMessage);
export const selectFadeRetryable = createSelector(selectFadeState, s => s.retryable);
export const selectFadeCanProcess = createSelector(selectFadeState, s => !!s.inputFile && s.status === 'idle');

export const fadeProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(FadeActions.startProcessing),
      withLatestFrom(store.select(selectFadeState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(FadeActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(FadeActions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(FadeActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(FadeActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);
