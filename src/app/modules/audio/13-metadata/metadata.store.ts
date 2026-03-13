import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface MetadataState {
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
const initialState: MetadataState = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,
};
export const MetadataActions = createActionGroup({
  source: '[Metadata]', events: {
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
export const metadataReducer = createReducer(
  initialState,
  on(MetadataActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(MetadataActions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(MetadataActions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(MetadataActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(MetadataActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(MetadataActions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(MetadataActions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(MetadataActions.resetState, () => ({ ...initialState })),
);
export const selectMetadataState = createFeatureSelector<MetadataState>('metadata');
export const selectMetadataStatus = createSelector(selectMetadataState, s => s.status);
export const selectMetadataInputFile = createSelector(selectMetadataState, s => s.inputFile);
export const selectMetadataAudioMeta = createSelector(selectMetadataState, s => s.audioMeta);
export const selectMetadataOutputBlob = createSelector(selectMetadataState, s => s.outputBlob);
export const selectMetadataOutputSizeMB = createSelector(selectMetadataState, s => s.outputSizeMB);
export const selectMetadataIsLoading = createSelector(selectMetadataState, s => s.status === 'loading' || s.status === 'processing');
export const selectMetadataIsDone = createSelector(selectMetadataState, s => s.status === 'done');
export const selectMetadataHasError = createSelector(selectMetadataState, s => s.status === 'error');
export const selectMetadataErrorMessage = createSelector(selectMetadataState, s => s.errorMessage);
export const selectMetadataRetryable = createSelector(selectMetadataState, s => s.retryable);
export const selectMetadataCanProcess = createSelector(selectMetadataState, s => !!s.inputFile && s.status === 'idle');

export const metadataProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(MetadataActions.startProcessing),
      withLatestFrom(store.select(selectMetadataState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(MetadataActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(MetadataActions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(MetadataActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(MetadataActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);
