import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface TimeStretchState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: TimeStretchState = {
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
export const TimeStretchActions = createActionGroup({
  source: '[TimeStretch]',
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
export const timestretchReducer = createReducer(
  initialState,
  on(TimeStretchActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(TimeStretchActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(TimeStretchActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(TimeStretchActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(TimeStretchActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(TimeStretchActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectTimeStretchState = createFeatureSelector<TimeStretchState>('time-stretch');
export const selectTimeStretchStatus = createSelector(selectTimeStretchState, (s) => s.status);
export const selectTimeStretchProgress = createSelector(selectTimeStretchState, (s) => s.progress);
export const selectTimeStretchOutputBlob = createSelector(selectTimeStretchState, (s) => s.outputBlob);
export const selectTimeStretchOutputSizeMB = createSelector(selectTimeStretchState, (s) => s.outputSizeMB);
export const selectTimeStretchErrorMessage = createSelector(selectTimeStretchState, (s) => s.errorMessage);
export const selectTimeStretchRetryable = createSelector(selectTimeStretchState, (s) => s.retryable);
export const selectTimeStretchInputFile = createSelector(selectTimeStretchState, (s) => s.inputFile);
export const selectTimeStretchIsLoading = createSelector(selectTimeStretchStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectTimeStretchIsDone = createSelector(selectTimeStretchStatus, (s) => s === 'done');
export const selectTimeStretchHasError = createSelector(selectTimeStretchStatus, (s) => s === 'error');
export const selectTimeStretchCanProcess = createSelector(selectTimeStretchState, (s) => s.inputFile !== null && s.status === 'idle');
