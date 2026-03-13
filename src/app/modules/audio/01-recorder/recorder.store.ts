import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface RecorderState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: RecorderState = {
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
export const RecorderActions = createActionGroup({
  source: '[Recorder]',
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
export const recorderReducer = createReducer(
  initialState,
  on(RecorderActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(RecorderActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(RecorderActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(RecorderActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(RecorderActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(RecorderActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectRecorderState = createFeatureSelector<RecorderState>('recorder');
export const selectRecorderStatus = createSelector(selectRecorderState, (s) => s.status);
export const selectRecorderProgress = createSelector(selectRecorderState, (s) => s.progress);
export const selectRecorderOutputBlob = createSelector(selectRecorderState, (s) => s.outputBlob);
export const selectRecorderOutputSizeMB = createSelector(selectRecorderState, (s) => s.outputSizeMB);
export const selectRecorderErrorMessage = createSelector(selectRecorderState, (s) => s.errorMessage);
export const selectRecorderRetryable = createSelector(selectRecorderState, (s) => s.retryable);
export const selectRecorderInputFile = createSelector(selectRecorderState, (s) => s.inputFile);
export const selectRecorderIsLoading = createSelector(selectRecorderStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectRecorderIsDone = createSelector(selectRecorderStatus, (s) => s === 'done');
export const selectRecorderHasError = createSelector(selectRecorderStatus, (s) => s === 'error');
export const selectRecorderCanProcess = createSelector(selectRecorderState, (s) => s.inputFile !== null && s.status === 'idle');
