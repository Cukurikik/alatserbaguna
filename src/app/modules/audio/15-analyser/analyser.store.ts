import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface AnalyserState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: AnalyserState = {
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
export const AnalyserActions = createActionGroup({
  source: '[Analyser]',
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
export const analyserReducer = createReducer(
  initialState,
  on(AnalyserActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(AnalyserActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(AnalyserActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(AnalyserActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(AnalyserActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(AnalyserActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectAnalyserState = createFeatureSelector<AnalyserState>('analyser');
export const selectAnalyserStatus = createSelector(selectAnalyserState, (s) => s.status);
export const selectAnalyserProgress = createSelector(selectAnalyserState, (s) => s.progress);
export const selectAnalyserOutputBlob = createSelector(selectAnalyserState, (s) => s.outputBlob);
export const selectAnalyserOutputSizeMB = createSelector(selectAnalyserState, (s) => s.outputSizeMB);
export const selectAnalyserErrorMessage = createSelector(selectAnalyserState, (s) => s.errorMessage);
export const selectAnalyserRetryable = createSelector(selectAnalyserState, (s) => s.retryable);
export const selectAnalyserInputFile = createSelector(selectAnalyserState, (s) => s.inputFile);
export const selectAnalyserIsLoading = createSelector(selectAnalyserStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectAnalyserIsDone = createSelector(selectAnalyserStatus, (s) => s === 'done');
export const selectAnalyserHasError = createSelector(selectAnalyserStatus, (s) => s === 'error');
export const selectAnalyserCanProcess = createSelector(selectAnalyserState, (s) => s.inputFile !== null && s.status === 'idle');
