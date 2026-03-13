import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface WatermarkState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: WatermarkState = {
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
export const WatermarkActions = createActionGroup({
  source: '[Watermark]',
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
export const watermarkReducer = createReducer(
  initialState,
  on(WatermarkActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(WatermarkActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(WatermarkActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(WatermarkActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(WatermarkActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(WatermarkActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectWatermarkState = createFeatureSelector<WatermarkState>('watermark');
export const selectWatermarkStatus = createSelector(selectWatermarkState, (s) => s.status);
export const selectWatermarkProgress = createSelector(selectWatermarkState, (s) => s.progress);
export const selectWatermarkOutputBlob = createSelector(selectWatermarkState, (s) => s.outputBlob);
export const selectWatermarkOutputSizeMB = createSelector(selectWatermarkState, (s) => s.outputSizeMB);
export const selectWatermarkErrorMessage = createSelector(selectWatermarkState, (s) => s.errorMessage);
export const selectWatermarkRetryable = createSelector(selectWatermarkState, (s) => s.retryable);
export const selectWatermarkInputFile = createSelector(selectWatermarkState, (s) => s.inputFile);
export const selectWatermarkIsLoading = createSelector(selectWatermarkStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectWatermarkIsDone = createSelector(selectWatermarkStatus, (s) => s === 'done');
export const selectWatermarkHasError = createSelector(selectWatermarkStatus, (s) => s === 'error');
export const selectWatermarkCanProcess = createSelector(selectWatermarkState, (s) => s.inputFile !== null && s.status === 'idle');
