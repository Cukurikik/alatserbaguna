import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface VisualizerState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: VisualizerState = {
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
export const VisualizerActions = createActionGroup({
  source: '[Visualizer]',
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
export const visualizerReducer = createReducer(
  initialState,
  on(VisualizerActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(VisualizerActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(VisualizerActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(VisualizerActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(VisualizerActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(VisualizerActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectVisualizerState = createFeatureSelector<VisualizerState>('visualizer');
export const selectVisualizerStatus = createSelector(selectVisualizerState, (s) => s.status);
export const selectVisualizerProgress = createSelector(selectVisualizerState, (s) => s.progress);
export const selectVisualizerOutputBlob = createSelector(selectVisualizerState, (s) => s.outputBlob);
export const selectVisualizerOutputSizeMB = createSelector(selectVisualizerState, (s) => s.outputSizeMB);
export const selectVisualizerErrorMessage = createSelector(selectVisualizerState, (s) => s.errorMessage);
export const selectVisualizerRetryable = createSelector(selectVisualizerState, (s) => s.retryable);
export const selectVisualizerInputFile = createSelector(selectVisualizerState, (s) => s.inputFile);
export const selectVisualizerIsLoading = createSelector(selectVisualizerStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectVisualizerIsDone = createSelector(selectVisualizerStatus, (s) => s === 'done');
export const selectVisualizerHasError = createSelector(selectVisualizerStatus, (s) => s === 'error');
export const selectVisualizerCanProcess = createSelector(selectVisualizerState, (s) => s.inputFile !== null && s.status === 'idle');
