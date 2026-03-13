import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface StemSplitterState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: StemSplitterState = {
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
export const StemSplitterActions = createActionGroup({
  source: '[StemSplitter]',
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
export const stemsplitterReducer = createReducer(
  initialState,
  on(StemSplitterActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(StemSplitterActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(StemSplitterActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(StemSplitterActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(StemSplitterActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(StemSplitterActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectStemSplitterState = createFeatureSelector<StemSplitterState>('stem-splitter');
export const selectStemSplitterStatus = createSelector(selectStemSplitterState, (s) => s.status);
export const selectStemSplitterProgress = createSelector(selectStemSplitterState, (s) => s.progress);
export const selectStemSplitterOutputBlob = createSelector(selectStemSplitterState, (s) => s.outputBlob);
export const selectStemSplitterOutputSizeMB = createSelector(selectStemSplitterState, (s) => s.outputSizeMB);
export const selectStemSplitterErrorMessage = createSelector(selectStemSplitterState, (s) => s.errorMessage);
export const selectStemSplitterRetryable = createSelector(selectStemSplitterState, (s) => s.retryable);
export const selectStemSplitterInputFile = createSelector(selectStemSplitterState, (s) => s.inputFile);
export const selectStemSplitterIsLoading = createSelector(selectStemSplitterStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectStemSplitterIsDone = createSelector(selectStemSplitterStatus, (s) => s === 'done');
export const selectStemSplitterHasError = createSelector(selectStemSplitterStatus, (s) => s === 'error');
export const selectStemSplitterCanProcess = createSelector(selectStemSplitterState, (s) => s.inputFile !== null && s.status === 'idle');
