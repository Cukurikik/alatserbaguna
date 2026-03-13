import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface SilenceRemoverState {
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
const initialState: SilenceRemoverState = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,
};
export const SilenceRemoverActions = createActionGroup({
  source: '[SilenceRemover]', events: {
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
export const silenceRemoverReducer = createReducer(
  initialState,
  on(SilenceRemoverActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(SilenceRemoverActions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(SilenceRemoverActions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(SilenceRemoverActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(SilenceRemoverActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(SilenceRemoverActions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(SilenceRemoverActions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(SilenceRemoverActions.resetState, () => ({ ...initialState })),
);
export const selectSilenceRemoverState = createFeatureSelector<SilenceRemoverState>('silence-remover');
export const selectSilenceRemoverStatus = createSelector(selectSilenceRemoverState, s => s.status);
export const selectSilenceRemoverInputFile = createSelector(selectSilenceRemoverState, s => s.inputFile);
export const selectSilenceRemoverAudioMeta = createSelector(selectSilenceRemoverState, s => s.audioMeta);
export const selectSilenceRemoverOutputBlob = createSelector(selectSilenceRemoverState, s => s.outputBlob);
export const selectSilenceRemoverOutputSizeMB = createSelector(selectSilenceRemoverState, s => s.outputSizeMB);
export const selectSilenceRemoverIsLoading = createSelector(selectSilenceRemoverState, s => s.status === 'loading' || s.status === 'processing');
export const selectSilenceRemoverIsDone = createSelector(selectSilenceRemoverState, s => s.status === 'done');
export const selectSilenceRemoverHasError = createSelector(selectSilenceRemoverState, s => s.status === 'error');
export const selectSilenceRemoverErrorMessage = createSelector(selectSilenceRemoverState, s => s.errorMessage);
export const selectSilenceRemoverRetryable = createSelector(selectSilenceRemoverState, s => s.retryable);
export const selectSilenceRemoverCanProcess = createSelector(selectSilenceRemoverState, s => !!s.inputFile && s.status === 'idle');

export const silenceRemoverProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(SilenceRemoverActions.startProcessing),
      withLatestFrom(store.select(selectSilenceRemoverState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(SilenceRemoverActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(SilenceRemoverActions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(SilenceRemoverActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(SilenceRemoverActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);

export const silenceremoverReducer = silenceRemoverReducer;
export const silenceremoverProcessingEffect = silenceRemoverProcessingEffect;