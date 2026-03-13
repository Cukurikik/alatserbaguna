import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface EqualizerState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: EqualizerState = {
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
export const EqualizerActions = createActionGroup({
  source: '[Equalizer]',
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
export const equalizerReducer = createReducer(
  initialState,
  on(EqualizerActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(EqualizerActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(EqualizerActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(EqualizerActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(EqualizerActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(EqualizerActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectEqualizerState = createFeatureSelector<EqualizerState>('equalizer');
export const selectEqualizerStatus = createSelector(selectEqualizerState, (s) => s.status);
export const selectEqualizerProgress = createSelector(selectEqualizerState, (s) => s.progress);
export const selectEqualizerOutputBlob = createSelector(selectEqualizerState, (s) => s.outputBlob);
export const selectEqualizerOutputSizeMB = createSelector(selectEqualizerState, (s) => s.outputSizeMB);
export const selectEqualizerErrorMessage = createSelector(selectEqualizerState, (s) => s.errorMessage);
export const selectEqualizerRetryable = createSelector(selectEqualizerState, (s) => s.retryable);
export const selectEqualizerInputFile = createSelector(selectEqualizerState, (s) => s.inputFile);
export const selectEqualizerIsLoading = createSelector(selectEqualizerStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectEqualizerIsDone = createSelector(selectEqualizerStatus, (s) => s === 'done');
export const selectEqualizerHasError = createSelector(selectEqualizerStatus, (s) => s === 'error');
export const selectEqualizerCanProcess = createSelector(selectEqualizerState, (s) => s.inputFile !== null && s.status === 'idle');
