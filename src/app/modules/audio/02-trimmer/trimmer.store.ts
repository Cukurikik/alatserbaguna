import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface TrimmerState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: TrimmerState = {
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
export const TrimmerActions = createActionGroup({
  source: '[Trimmer]',
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
export const trimmerReducer = createReducer(
  initialState,
  on(TrimmerActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(TrimmerActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(TrimmerActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(TrimmerActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(TrimmerActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(TrimmerActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectTrimmerState = createFeatureSelector<TrimmerState>('trimmer');
export const selectTrimmerStatus = createSelector(selectTrimmerState, (s) => s.status);
export const selectTrimmerProgress = createSelector(selectTrimmerState, (s) => s.progress);
export const selectTrimmerOutputBlob = createSelector(selectTrimmerState, (s) => s.outputBlob);
export const selectTrimmerOutputSizeMB = createSelector(selectTrimmerState, (s) => s.outputSizeMB);
export const selectTrimmerErrorMessage = createSelector(selectTrimmerState, (s) => s.errorMessage);
export const selectTrimmerRetryable = createSelector(selectTrimmerState, (s) => s.retryable);
export const selectTrimmerInputFile = createSelector(selectTrimmerState, (s) => s.inputFile);
export const selectTrimmerIsLoading = createSelector(selectTrimmerStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectTrimmerIsDone = createSelector(selectTrimmerStatus, (s) => s === 'done');
export const selectTrimmerHasError = createSelector(selectTrimmerStatus, (s) => s === 'error');
export const selectTrimmerCanProcess = createSelector(selectTrimmerState, (s) => s.inputFile !== null && s.status === 'idle');
