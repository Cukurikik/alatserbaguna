import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface ReverserState {
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
const initialState: ReverserState = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,
};
export const ReverserActions = createActionGroup({
  source: '[Reverser]', events: {
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
export const reverserReducer = createReducer(
  initialState,
  on(ReverserActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(ReverserActions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(ReverserActions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(ReverserActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(ReverserActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(ReverserActions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(ReverserActions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(ReverserActions.resetState, () => ({ ...initialState })),
);
export const selectReverserState = createFeatureSelector<ReverserState>('reverser');
export const selectReverserStatus = createSelector(selectReverserState, s => s.status);
export const selectReverserInputFile = createSelector(selectReverserState, s => s.inputFile);
export const selectReverserAudioMeta = createSelector(selectReverserState, s => s.audioMeta);
export const selectReverserOutputBlob = createSelector(selectReverserState, s => s.outputBlob);
export const selectReverserOutputSizeMB = createSelector(selectReverserState, s => s.outputSizeMB);
export const selectReverserIsLoading = createSelector(selectReverserState, s => s.status === 'loading' || s.status === 'processing');
export const selectReverserIsDone = createSelector(selectReverserState, s => s.status === 'done');
export const selectReverserHasError = createSelector(selectReverserState, s => s.status === 'error');
export const selectReverserErrorMessage = createSelector(selectReverserState, s => s.errorMessage);
export const selectReverserRetryable = createSelector(selectReverserState, s => s.retryable);
export const selectReverserCanProcess = createSelector(selectReverserState, s => !!s.inputFile && s.status === 'idle');

export const reverserProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(ReverserActions.startProcessing),
      withLatestFrom(store.select(selectReverserState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(ReverserActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(ReverserActions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(ReverserActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(ReverserActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);
