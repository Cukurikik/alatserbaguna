import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

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
    'Start Processing': emptyProps(),
    'Update Progress': props<{ value: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

// ─── Reducer ─────────────────────────────────────────────────────────────────
export const pitchshifterReducer = createReducer(
  initialState,
  on(PitchShifterActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(PitchShifterActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
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
export const selectPitchShifterIsLoading = createSelector(selectPitchShifterStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectPitchShifterIsDone = createSelector(selectPitchShifterStatus, (s) => s === 'done');
export const selectPitchShifterHasError = createSelector(selectPitchShifterStatus, (s) => s === 'error');
export const selectPitchShifterCanProcess = createSelector(selectPitchShifterState, (s) => s.inputFile !== null && s.status === 'idle');
