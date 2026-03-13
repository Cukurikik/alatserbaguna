import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface TranscriberState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: TranscriberState = {
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
export const TranscriberActions = createActionGroup({
  source: '[Transcriber]',
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
export const transcriberReducer = createReducer(
  initialState,
  on(TranscriberActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(TranscriberActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(TranscriberActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(TranscriberActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(TranscriberActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(TranscriberActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectTranscriberState = createFeatureSelector<TranscriberState>('transcriber');
export const selectTranscriberStatus = createSelector(selectTranscriberState, (s) => s.status);
export const selectTranscriberProgress = createSelector(selectTranscriberState, (s) => s.progress);
export const selectTranscriberOutputBlob = createSelector(selectTranscriberState, (s) => s.outputBlob);
export const selectTranscriberOutputSizeMB = createSelector(selectTranscriberState, (s) => s.outputSizeMB);
export const selectTranscriberErrorMessage = createSelector(selectTranscriberState, (s) => s.errorMessage);
export const selectTranscriberRetryable = createSelector(selectTranscriberState, (s) => s.retryable);
export const selectTranscriberInputFile = createSelector(selectTranscriberState, (s) => s.inputFile);
export const selectTranscriberIsLoading = createSelector(selectTranscriberStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectTranscriberIsDone = createSelector(selectTranscriberStatus, (s) => s === 'done');
export const selectTranscriberHasError = createSelector(selectTranscriberStatus, (s) => s === 'error');
export const selectTranscriberCanProcess = createSelector(selectTranscriberState, (s) => s.inputFile !== null && s.status === 'idle');
