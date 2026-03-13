import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface LimiterState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: LimiterState = {
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
export const LimiterActions = createActionGroup({
  source: '[Limiter]',
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
export const limiterReducer = createReducer(
  initialState,
  on(LimiterActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(LimiterActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(LimiterActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(LimiterActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(LimiterActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(LimiterActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectLimiterState = createFeatureSelector<LimiterState>('limiter');
export const selectLimiterStatus = createSelector(selectLimiterState, (s) => s.status);
export const selectLimiterProgress = createSelector(selectLimiterState, (s) => s.progress);
export const selectLimiterOutputBlob = createSelector(selectLimiterState, (s) => s.outputBlob);
export const selectLimiterOutputSizeMB = createSelector(selectLimiterState, (s) => s.outputSizeMB);
export const selectLimiterErrorMessage = createSelector(selectLimiterState, (s) => s.errorMessage);
export const selectLimiterRetryable = createSelector(selectLimiterState, (s) => s.retryable);
export const selectLimiterInputFile = createSelector(selectLimiterState, (s) => s.inputFile);
export const selectLimiterIsLoading = createSelector(selectLimiterStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectLimiterIsDone = createSelector(selectLimiterStatus, (s) => s === 'done');
export const selectLimiterHasError = createSelector(selectLimiterStatus, (s) => s === 'error');
export const selectLimiterCanProcess = createSelector(selectLimiterState, (s) => s.inputFile !== null && s.status === 'idle');
