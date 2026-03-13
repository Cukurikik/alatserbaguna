import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface BatchState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: BatchState = {
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
export const BatchActions = createActionGroup({
  source: '[Batch]',
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
export const batchReducer = createReducer(
  initialState,
  on(BatchActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(BatchActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(BatchActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(BatchActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(BatchActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(BatchActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectBatchState = createFeatureSelector<BatchState>('batch');
export const selectBatchStatus = createSelector(selectBatchState, (s) => s.status);
export const selectBatchProgress = createSelector(selectBatchState, (s) => s.progress);
export const selectBatchOutputBlob = createSelector(selectBatchState, (s) => s.outputBlob);
export const selectBatchOutputSizeMB = createSelector(selectBatchState, (s) => s.outputSizeMB);
export const selectBatchErrorMessage = createSelector(selectBatchState, (s) => s.errorMessage);
export const selectBatchRetryable = createSelector(selectBatchState, (s) => s.retryable);
export const selectBatchInputFile = createSelector(selectBatchState, (s) => s.inputFile);
export const selectBatchIsLoading = createSelector(selectBatchStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectBatchIsDone = createSelector(selectBatchStatus, (s) => s === 'done');
export const selectBatchHasError = createSelector(selectBatchStatus, (s) => s === 'error');
export const selectBatchCanProcess = createSelector(selectBatchState, (s) => s.inputFile !== null && s.status === 'idle');
