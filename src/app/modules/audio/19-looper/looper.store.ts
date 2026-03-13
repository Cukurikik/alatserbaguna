import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface LooperState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: LooperState = {
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
export const LooperActions = createActionGroup({
  source: '[Looper]',
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
export const looperReducer = createReducer(
  initialState,
  on(LooperActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(LooperActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(LooperActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(LooperActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(LooperActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(LooperActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectLooperState = createFeatureSelector<LooperState>('looper');
export const selectLooperStatus = createSelector(selectLooperState, (s) => s.status);
export const selectLooperProgress = createSelector(selectLooperState, (s) => s.progress);
export const selectLooperOutputBlob = createSelector(selectLooperState, (s) => s.outputBlob);
export const selectLooperOutputSizeMB = createSelector(selectLooperState, (s) => s.outputSizeMB);
export const selectLooperErrorMessage = createSelector(selectLooperState, (s) => s.errorMessage);
export const selectLooperRetryable = createSelector(selectLooperState, (s) => s.retryable);
export const selectLooperInputFile = createSelector(selectLooperState, (s) => s.inputFile);
export const selectLooperIsLoading = createSelector(selectLooperStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectLooperIsDone = createSelector(selectLooperStatus, (s) => s === 'done');
export const selectLooperHasError = createSelector(selectLooperStatus, (s) => s === 'error');
export const selectLooperCanProcess = createSelector(selectLooperState, (s) => s.inputFile !== null && s.status === 'idle');
