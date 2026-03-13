import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface NormalizerState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: NormalizerState = {
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
export const NormalizerActions = createActionGroup({
  source: '[Normalizer]',
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
export const normalizerReducer = createReducer(
  initialState,
  on(NormalizerActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(NormalizerActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(NormalizerActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(NormalizerActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(NormalizerActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(NormalizerActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectNormalizerState = createFeatureSelector<NormalizerState>('normalizer');
export const selectNormalizerStatus = createSelector(selectNormalizerState, (s) => s.status);
export const selectNormalizerProgress = createSelector(selectNormalizerState, (s) => s.progress);
export const selectNormalizerOutputBlob = createSelector(selectNormalizerState, (s) => s.outputBlob);
export const selectNormalizerOutputSizeMB = createSelector(selectNormalizerState, (s) => s.outputSizeMB);
export const selectNormalizerErrorMessage = createSelector(selectNormalizerState, (s) => s.errorMessage);
export const selectNormalizerRetryable = createSelector(selectNormalizerState, (s) => s.retryable);
export const selectNormalizerInputFile = createSelector(selectNormalizerState, (s) => s.inputFile);
export const selectNormalizerIsLoading = createSelector(selectNormalizerStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectNormalizerIsDone = createSelector(selectNormalizerStatus, (s) => s === 'done');
export const selectNormalizerHasError = createSelector(selectNormalizerStatus, (s) => s === 'error');
export const selectNormalizerCanProcess = createSelector(selectNormalizerState, (s) => s.inputFile !== null && s.status === 'idle');
