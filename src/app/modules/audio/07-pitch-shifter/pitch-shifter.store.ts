import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface PitchShifterState {
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
const initialState: PitchShifterState = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,
};
export const PitchShifterActions = createActionGroup({
  source: '[PitchShifter]', events: {
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
export const pitchShifterReducer = createReducer(
  initialState,
  on(PitchShifterActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(PitchShifterActions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(PitchShifterActions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(PitchShifterActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(PitchShifterActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(PitchShifterActions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(PitchShifterActions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(PitchShifterActions.resetState, () => ({ ...initialState })),
);
export const selectPitchShifterState = createFeatureSelector<PitchShifterState>('pitch-shifter');
export const selectPitchShifterStatus = createSelector(selectPitchShifterState, s => s.status);
export const selectPitchShifterInputFile = createSelector(selectPitchShifterState, s => s.inputFile);
export const selectPitchShifterAudioMeta = createSelector(selectPitchShifterState, s => s.audioMeta);
export const selectPitchShifterOutputBlob = createSelector(selectPitchShifterState, s => s.outputBlob);
export const selectPitchShifterOutputSizeMB = createSelector(selectPitchShifterState, s => s.outputSizeMB);
export const selectPitchShifterIsLoading = createSelector(selectPitchShifterState, s => s.status === 'loading' || s.status === 'processing');
export const selectPitchShifterIsDone = createSelector(selectPitchShifterState, s => s.status === 'done');
export const selectPitchShifterHasError = createSelector(selectPitchShifterState, s => s.status === 'error');
export const selectPitchShifterErrorMessage = createSelector(selectPitchShifterState, s => s.errorMessage);
export const selectPitchShifterRetryable = createSelector(selectPitchShifterState, s => s.retryable);
export const selectPitchShifterCanProcess = createSelector(selectPitchShifterState, s => !!s.inputFile && s.status === 'idle');

export const pitchShifterProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(PitchShifterActions.startProcessing),
      withLatestFrom(store.select(selectPitchShifterState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(PitchShifterActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(PitchShifterActions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(PitchShifterActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(PitchShifterActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);

export const pitchshifterReducer = pitchShifterReducer;
export const pitchshifterProcessingEffect = pitchShifterProcessingEffect;