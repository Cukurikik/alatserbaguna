import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface ReverbState {
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
const initialState: ReverbState = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,
};
export const ReverbActions = createActionGroup({
  source: '[Reverb]', events: {
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
export const reverbReducer = createReducer(
  initialState,
  on(ReverbActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(ReverbActions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(ReverbActions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(ReverbActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(ReverbActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(ReverbActions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(ReverbActions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(ReverbActions.resetState, () => ({ ...initialState })),
);
export const selectReverbState = createFeatureSelector<ReverbState>('reverb');
export const selectReverbStatus = createSelector(selectReverbState, s => s.status);
export const selectReverbInputFile = createSelector(selectReverbState, s => s.inputFile);
export const selectReverbAudioMeta = createSelector(selectReverbState, s => s.audioMeta);
export const selectReverbOutputBlob = createSelector(selectReverbState, s => s.outputBlob);
export const selectReverbOutputSizeMB = createSelector(selectReverbState, s => s.outputSizeMB);
export const selectReverbIsLoading = createSelector(selectReverbState, s => s.status === 'loading' || s.status === 'processing');
export const selectReverbIsDone = createSelector(selectReverbState, s => s.status === 'done');
export const selectReverbHasError = createSelector(selectReverbState, s => s.status === 'error');
export const selectReverbErrorMessage = createSelector(selectReverbState, s => s.errorMessage);
export const selectReverbRetryable = createSelector(selectReverbState, s => s.retryable);
export const selectReverbCanProcess = createSelector(selectReverbState, s => !!s.inputFile && s.status === 'idle');

export const reverbProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(ReverbActions.startProcessing),
      withLatestFrom(store.select(selectReverbState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(ReverbActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(ReverbActions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(ReverbActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(ReverbActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);
