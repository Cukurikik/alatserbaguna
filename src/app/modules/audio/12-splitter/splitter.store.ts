import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface SplitterState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: SplitterState = {
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
export const SplitterActions = createActionGroup({
  source: '[Splitter]',
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
export const splitterReducer = createReducer(
  initialState,
  on(SplitterActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(SplitterActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(SplitterActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(SplitterActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(SplitterActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(SplitterActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectSplitterState = createFeatureSelector<SplitterState>('splitter');
export const selectSplitterStatus = createSelector(selectSplitterState, (s) => s.status);
export const selectSplitterProgress = createSelector(selectSplitterState, (s) => s.progress);
export const selectSplitterOutputBlob = createSelector(selectSplitterState, (s) => s.outputBlob);
export const selectSplitterOutputSizeMB = createSelector(selectSplitterState, (s) => s.outputSizeMB);
export const selectSplitterErrorMessage = createSelector(selectSplitterState, (s) => s.errorMessage);
export const selectSplitterRetryable = createSelector(selectSplitterState, (s) => s.retryable);
export const selectSplitterInputFile = createSelector(selectSplitterState, (s) => s.inputFile);
export const selectSplitterIsLoading = createSelector(selectSplitterStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectSplitterIsDone = createSelector(selectSplitterStatus, (s) => s === 'done');
export const selectSplitterHasError = createSelector(selectSplitterStatus, (s) => s === 'error');
export const selectSplitterCanProcess = createSelector(selectSplitterState, (s) => s.inputFile !== null && s.status === 'idle');
