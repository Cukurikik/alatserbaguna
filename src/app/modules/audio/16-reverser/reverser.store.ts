import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface ReverserState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: ReverserState = {
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
export const ReverserActions = createActionGroup({
  source: '[Reverser]',
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
export const reverserReducer = createReducer(
  initialState,
  on(ReverserActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(ReverserActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(ReverserActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(ReverserActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(ReverserActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(ReverserActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectReverserState = createFeatureSelector<ReverserState>('reverser');
export const selectReverserStatus = createSelector(selectReverserState, (s) => s.status);
export const selectReverserProgress = createSelector(selectReverserState, (s) => s.progress);
export const selectReverserOutputBlob = createSelector(selectReverserState, (s) => s.outputBlob);
export const selectReverserOutputSizeMB = createSelector(selectReverserState, (s) => s.outputSizeMB);
export const selectReverserErrorMessage = createSelector(selectReverserState, (s) => s.errorMessage);
export const selectReverserRetryable = createSelector(selectReverserState, (s) => s.retryable);
export const selectReverserInputFile = createSelector(selectReverserState, (s) => s.inputFile);
export const selectReverserIsLoading = createSelector(selectReverserStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectReverserIsDone = createSelector(selectReverserStatus, (s) => s === 'done');
export const selectReverserHasError = createSelector(selectReverserStatus, (s) => s === 'error');
export const selectReverserCanProcess = createSelector(selectReverserState, (s) => s.inputFile !== null && s.status === 'idle');
