import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface ConverterState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: ConverterState = {
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
export const ConverterActions = createActionGroup({
  source: '[Converter]',
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
export const converterReducer = createReducer(
  initialState,
  on(ConverterActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(ConverterActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(ConverterActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(ConverterActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(ConverterActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(ConverterActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectConverterState = createFeatureSelector<ConverterState>('converter');
export const selectConverterStatus = createSelector(selectConverterState, (s) => s.status);
export const selectConverterProgress = createSelector(selectConverterState, (s) => s.progress);
export const selectConverterOutputBlob = createSelector(selectConverterState, (s) => s.outputBlob);
export const selectConverterOutputSizeMB = createSelector(selectConverterState, (s) => s.outputSizeMB);
export const selectConverterErrorMessage = createSelector(selectConverterState, (s) => s.errorMessage);
export const selectConverterRetryable = createSelector(selectConverterState, (s) => s.retryable);
export const selectConverterInputFile = createSelector(selectConverterState, (s) => s.inputFile);
export const selectConverterIsLoading = createSelector(selectConverterStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectConverterIsDone = createSelector(selectConverterStatus, (s) => s === 'done');
export const selectConverterHasError = createSelector(selectConverterStatus, (s) => s === 'error');
export const selectConverterCanProcess = createSelector(selectConverterState, (s) => s.inputFile !== null && s.status === 'idle');
