import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface FadeState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: FadeState = {
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
export const FadeActions = createActionGroup({
  source: '[Fade]',
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
export const fadeReducer = createReducer(
  initialState,
  on(FadeActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(FadeActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(FadeActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(FadeActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(FadeActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(FadeActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectFadeState = createFeatureSelector<FadeState>('fade');
export const selectFadeStatus = createSelector(selectFadeState, (s) => s.status);
export const selectFadeProgress = createSelector(selectFadeState, (s) => s.progress);
export const selectFadeOutputBlob = createSelector(selectFadeState, (s) => s.outputBlob);
export const selectFadeOutputSizeMB = createSelector(selectFadeState, (s) => s.outputSizeMB);
export const selectFadeErrorMessage = createSelector(selectFadeState, (s) => s.errorMessage);
export const selectFadeRetryable = createSelector(selectFadeState, (s) => s.retryable);
export const selectFadeInputFile = createSelector(selectFadeState, (s) => s.inputFile);
export const selectFadeIsLoading = createSelector(selectFadeStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectFadeIsDone = createSelector(selectFadeStatus, (s) => s === 'done');
export const selectFadeHasError = createSelector(selectFadeStatus, (s) => s === 'error');
export const selectFadeCanProcess = createSelector(selectFadeState, (s) => s.inputFile !== null && s.status === 'idle');
