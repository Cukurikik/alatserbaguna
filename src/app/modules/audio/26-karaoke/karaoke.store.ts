import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface KaraokeState {
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
const initialState: KaraokeState = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,
};
export const KaraokeActions = createActionGroup({
  source: '[Karaoke]', events: {
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
export const karaokeReducer = createReducer(
  initialState,
  on(KaraokeActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(KaraokeActions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(KaraokeActions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(KaraokeActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(KaraokeActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(KaraokeActions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(KaraokeActions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(KaraokeActions.resetState, () => ({ ...initialState })),
);
export const selectKaraokeState = createFeatureSelector<KaraokeState>('karaoke');
export const selectKaraokeStatus = createSelector(selectKaraokeState, s => s.status);
export const selectKaraokeInputFile = createSelector(selectKaraokeState, s => s.inputFile);
export const selectKaraokeAudioMeta = createSelector(selectKaraokeState, s => s.audioMeta);
export const selectKaraokeOutputBlob = createSelector(selectKaraokeState, s => s.outputBlob);
export const selectKaraokeOutputSizeMB = createSelector(selectKaraokeState, s => s.outputSizeMB);
export const selectKaraokeIsLoading = createSelector(selectKaraokeState, s => s.status === 'loading' || s.status === 'processing');
export const selectKaraokeIsDone = createSelector(selectKaraokeState, s => s.status === 'done');
export const selectKaraokeHasError = createSelector(selectKaraokeState, s => s.status === 'error');
export const selectKaraokeErrorMessage = createSelector(selectKaraokeState, s => s.errorMessage);
export const selectKaraokeRetryable = createSelector(selectKaraokeState, s => s.retryable);
export const selectKaraokeCanProcess = createSelector(selectKaraokeState, s => !!s.inputFile && s.status === 'idle');

export const karaokeProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(KaraokeActions.startProcessing),
      withLatestFrom(store.select(selectKaraokeState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(KaraokeActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(KaraokeActions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(KaraokeActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(KaraokeActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);
