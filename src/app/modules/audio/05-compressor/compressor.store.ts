import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface CompressorState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: CompressorState = {
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
export const CompressorActions = createActionGroup({
  source: '[Compressor]',
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
export const compressorReducer = createReducer(
  initialState,
  on(CompressorActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(CompressorActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(CompressorActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(CompressorActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(CompressorActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(CompressorActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectCompressorState = createFeatureSelector<CompressorState>('compressor');
export const selectCompressorStatus = createSelector(selectCompressorState, (s) => s.status);
export const selectCompressorProgress = createSelector(selectCompressorState, (s) => s.progress);
export const selectCompressorOutputBlob = createSelector(selectCompressorState, (s) => s.outputBlob);
export const selectCompressorOutputSizeMB = createSelector(selectCompressorState, (s) => s.outputSizeMB);
export const selectCompressorErrorMessage = createSelector(selectCompressorState, (s) => s.errorMessage);
export const selectCompressorRetryable = createSelector(selectCompressorState, (s) => s.retryable);
export const selectCompressorInputFile = createSelector(selectCompressorState, (s) => s.inputFile);
export const selectCompressorIsLoading = createSelector(selectCompressorStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectCompressorIsDone = createSelector(selectCompressorStatus, (s) => s === 'done');
export const selectCompressorHasError = createSelector(selectCompressorStatus, (s) => s === 'error');
export const selectCompressorCanProcess = createSelector(selectCompressorState, (s) => s.inputFile !== null && s.status === 'idle');
