import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

// ─── State ───────────────────────────────────────────────────────────────────
export interface PitchShifterState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: PitchShifterState = {
  inputFile: null,
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false,
};

// ─── Actions ─────────────────────────────────────────────────────────────────
export const PitchShifterActions = createActionGroup({
  source: '[PitchShifter]',
  events: {
    'Load File': props<{ file: File }>(),
    'Start Processing': props<{ format: ExportFormat }>(),
    'Update Progress': props<{ value: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

// ─── Reducer ─────────────────────────────────────────────────────────────────
export const pitchshifterReducer = createReducer(
  initialState,
  on(PitchShifterActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'idle' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(PitchShifterActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(PitchShifterActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(PitchShifterActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(PitchShifterActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(PitchShifterActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectPitchShifterState = createFeatureSelector<PitchShifterState>('pitch-shifter');
export const selectPitchShifterStatus = createSelector(selectPitchShifterState, (s) => s.status);
export const selectPitchShifterProgress = createSelector(selectPitchShifterState, (s) => s.progress);
export const selectPitchShifterOutputBlob = createSelector(selectPitchShifterState, (s) => s.outputBlob);
export const selectPitchShifterOutputSizeMB = createSelector(selectPitchShifterState, (s) => s.outputSizeMB);
export const selectPitchShifterErrorMessage = createSelector(selectPitchShifterState, (s) => s.errorMessage);
export const selectPitchShifterRetryable = createSelector(selectPitchShifterState, (s) => s.retryable);
export const selectPitchShifterInputFile = createSelector(selectPitchShifterState, (s) => s.inputFile);

// ─── Effects ─────────────────────────────────────────────────────────────────
export const pitchshifterProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(PitchShifterActions.startProcessing),
      withLatestFrom(store.select(selectPitchShifterState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) {
          return of(PitchShifterActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file selected', retryable: false }));
        }
        
        return new Observable<any>(obs => {
          let aborted = false;
          const args = ["-i","{in}","-af","asetrate=44100*1.25,aresample=44100"]; // Feature-specific FFmpeg args
          
          ffmpeg.processAudio(
            state.inputFile!,
            format,
            args,
            (p) => { if (!aborted) store.dispatch(PitchShifterActions.updateProgress({ value: p })); }
          ).then(blob => {
            if (!aborted) {
              obs.next(PitchShifterActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 }));
              obs.complete();
            }
          }).catch(err => {
            if (!aborted) {
              obs.next(PitchShifterActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Validation failed or FFmpeg crashed', retryable: true }));
              obs.complete();
            }
          });

          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);
