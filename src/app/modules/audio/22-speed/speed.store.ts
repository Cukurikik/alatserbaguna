import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface SpeedState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: SpeedState = {
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
export const SpeedActions = createActionGroup({
  source: '[Speed]',
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
export const speedReducer = createReducer(
  initialState,
  on(SpeedActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(SpeedActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(SpeedActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(SpeedActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(SpeedActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(SpeedActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectSpeedState = createFeatureSelector<SpeedState>('speed');
export const selectSpeedStatus = createSelector(selectSpeedState, (s) => s.status);
export const selectSpeedProgress = createSelector(selectSpeedState, (s) => s.progress);
export const selectSpeedOutputBlob = createSelector(selectSpeedState, (s) => s.outputBlob);
export const selectSpeedOutputSizeMB = createSelector(selectSpeedState, (s) => s.outputSizeMB);
export const selectSpeedErrorMessage = createSelector(selectSpeedState, (s) => s.errorMessage);
export const selectSpeedRetryable = createSelector(selectSpeedState, (s) => s.retryable);
export const selectSpeedInputFile = createSelector(selectSpeedState, (s) => s.inputFile);
export const selectSpeedIsLoading = createSelector(selectSpeedStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectSpeedIsDone = createSelector(selectSpeedStatus, (s) => s === 'done');
export const selectSpeedHasError = createSelector(selectSpeedStatus, (s) => s === 'error');
export const selectSpeedCanProcess = createSelector(selectSpeedState, (s) => s.inputFile !== null && s.status === 'idle');
