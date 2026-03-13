import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface MergerState {
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
const initialState: MergerState = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,
};
export const MergerActions = createActionGroup({
  source: '[Merger]', events: {
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
export const mergerReducer = createReducer(
  initialState,
  on(MergerActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(MergerActions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(MergerActions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(MergerActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(MergerActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(MergerActions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(MergerActions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(MergerActions.resetState, () => ({ ...initialState })),
);
export const selectMergerState = createFeatureSelector<MergerState>('merger');
export const selectMergerStatus = createSelector(selectMergerState, s => s.status);
export const selectMergerInputFile = createSelector(selectMergerState, s => s.inputFile);
export const selectMergerAudioMeta = createSelector(selectMergerState, s => s.audioMeta);
export const selectMergerOutputBlob = createSelector(selectMergerState, s => s.outputBlob);
export const selectMergerOutputSizeMB = createSelector(selectMergerState, s => s.outputSizeMB);
export const selectMergerIsLoading = createSelector(selectMergerState, s => s.status === 'loading' || s.status === 'processing');
export const selectMergerIsDone = createSelector(selectMergerState, s => s.status === 'done');
export const selectMergerHasError = createSelector(selectMergerState, s => s.status === 'error');
export const selectMergerErrorMessage = createSelector(selectMergerState, s => s.errorMessage);
export const selectMergerRetryable = createSelector(selectMergerState, s => s.retryable);
export const selectMergerCanProcess = createSelector(selectMergerState, s => !!s.inputFile && s.status === 'idle');

export const mergerProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(MergerActions.startProcessing),
      withLatestFrom(store.select(selectMergerState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(MergerActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(MergerActions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(MergerActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(MergerActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);
