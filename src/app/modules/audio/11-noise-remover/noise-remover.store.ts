import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface NoiseRemoverState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: NoiseRemoverState = {
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
export const NoiseRemoverActions = createActionGroup({
  source: '[NoiseRemover]',
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
export const noiseremoverReducer = createReducer(
  initialState,
  on(NoiseRemoverActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(NoiseRemoverActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(NoiseRemoverActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(NoiseRemoverActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(NoiseRemoverActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(NoiseRemoverActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectNoiseRemoverState = createFeatureSelector<NoiseRemoverState>('noise-remover');
export const selectNoiseRemoverStatus = createSelector(selectNoiseRemoverState, (s) => s.status);
export const selectNoiseRemoverProgress = createSelector(selectNoiseRemoverState, (s) => s.progress);
export const selectNoiseRemoverOutputBlob = createSelector(selectNoiseRemoverState, (s) => s.outputBlob);
export const selectNoiseRemoverOutputSizeMB = createSelector(selectNoiseRemoverState, (s) => s.outputSizeMB);
export const selectNoiseRemoverErrorMessage = createSelector(selectNoiseRemoverState, (s) => s.errorMessage);
export const selectNoiseRemoverRetryable = createSelector(selectNoiseRemoverState, (s) => s.retryable);
export const selectNoiseRemoverInputFile = createSelector(selectNoiseRemoverState, (s) => s.inputFile);
export const selectNoiseRemoverIsLoading = createSelector(selectNoiseRemoverStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectNoiseRemoverIsDone = createSelector(selectNoiseRemoverStatus, (s) => s === 'done');
export const selectNoiseRemoverHasError = createSelector(selectNoiseRemoverStatus, (s) => s === 'error');
export const selectNoiseRemoverCanProcess = createSelector(selectNoiseRemoverState, (s) => s.inputFile !== null && s.status === 'idle');
