import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface CompressorState {
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
const initialState: CompressorState = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,
};
export const CompressorActions = createActionGroup({
  source: '[Compressor]', events: {
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
export const compressorReducer = createReducer(
  initialState,
  on(CompressorActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(CompressorActions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(CompressorActions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(CompressorActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(CompressorActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(CompressorActions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(CompressorActions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(CompressorActions.resetState, () => ({ ...initialState })),
);
export const selectCompressorState = createFeatureSelector<CompressorState>('compressor');
export const selectCompressorStatus = createSelector(selectCompressorState, s => s.status);
export const selectCompressorInputFile = createSelector(selectCompressorState, s => s.inputFile);
export const selectCompressorAudioMeta = createSelector(selectCompressorState, s => s.audioMeta);
export const selectCompressorOutputBlob = createSelector(selectCompressorState, s => s.outputBlob);
export const selectCompressorOutputSizeMB = createSelector(selectCompressorState, s => s.outputSizeMB);
export const selectCompressorIsLoading = createSelector(selectCompressorState, s => s.status === 'loading' || s.status === 'processing');
export const selectCompressorIsDone = createSelector(selectCompressorState, s => s.status === 'done');
export const selectCompressorHasError = createSelector(selectCompressorState, s => s.status === 'error');
export const selectCompressorErrorMessage = createSelector(selectCompressorState, s => s.errorMessage);
export const selectCompressorRetryable = createSelector(selectCompressorState, s => s.retryable);
export const selectCompressorCanProcess = createSelector(selectCompressorState, s => !!s.inputFile && s.status === 'idle');

export const compressorProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(CompressorActions.startProcessing),
      withLatestFrom(store.select(selectCompressorState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(CompressorActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(CompressorActions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(CompressorActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(CompressorActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);
