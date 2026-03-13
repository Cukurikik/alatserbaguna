import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface MetadataState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: MetadataState = {
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
export const MetadataActions = createActionGroup({
  source: '[Metadata]',
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
export const metadataReducer = createReducer(
  initialState,
  on(MetadataActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(MetadataActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(MetadataActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(MetadataActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(MetadataActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(MetadataActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectMetadataState = createFeatureSelector<MetadataState>('metadata');
export const selectMetadataStatus = createSelector(selectMetadataState, (s) => s.status);
export const selectMetadataProgress = createSelector(selectMetadataState, (s) => s.progress);
export const selectMetadataOutputBlob = createSelector(selectMetadataState, (s) => s.outputBlob);
export const selectMetadataOutputSizeMB = createSelector(selectMetadataState, (s) => s.outputSizeMB);
export const selectMetadataErrorMessage = createSelector(selectMetadataState, (s) => s.errorMessage);
export const selectMetadataRetryable = createSelector(selectMetadataState, (s) => s.retryable);
export const selectMetadataInputFile = createSelector(selectMetadataState, (s) => s.inputFile);
export const selectMetadataIsLoading = createSelector(selectMetadataStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectMetadataIsDone = createSelector(selectMetadataStatus, (s) => s === 'done');
export const selectMetadataHasError = createSelector(selectMetadataStatus, (s) => s === 'error');
export const selectMetadataCanProcess = createSelector(selectMetadataState, (s) => s.inputFile !== null && s.status === 'idle');
