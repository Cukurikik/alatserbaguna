import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface SilenceRemoverState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: SilenceRemoverState = {
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
export const SilenceRemoverActions = createActionGroup({
  source: '[SilenceRemover]',
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
export const silenceremoverReducer = createReducer(
  initialState,
  on(SilenceRemoverActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(SilenceRemoverActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(SilenceRemoverActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(SilenceRemoverActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(SilenceRemoverActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(SilenceRemoverActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectSilenceRemoverState = createFeatureSelector<SilenceRemoverState>('silence-remover');
export const selectSilenceRemoverStatus = createSelector(selectSilenceRemoverState, (s) => s.status);
export const selectSilenceRemoverProgress = createSelector(selectSilenceRemoverState, (s) => s.progress);
export const selectSilenceRemoverOutputBlob = createSelector(selectSilenceRemoverState, (s) => s.outputBlob);
export const selectSilenceRemoverOutputSizeMB = createSelector(selectSilenceRemoverState, (s) => s.outputSizeMB);
export const selectSilenceRemoverErrorMessage = createSelector(selectSilenceRemoverState, (s) => s.errorMessage);
export const selectSilenceRemoverRetryable = createSelector(selectSilenceRemoverState, (s) => s.retryable);
export const selectSilenceRemoverInputFile = createSelector(selectSilenceRemoverState, (s) => s.inputFile);
export const selectSilenceRemoverIsLoading = createSelector(selectSilenceRemoverStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectSilenceRemoverIsDone = createSelector(selectSilenceRemoverStatus, (s) => s === 'done');
export const selectSilenceRemoverHasError = createSelector(selectSilenceRemoverStatus, (s) => s === 'error');
export const selectSilenceRemoverCanProcess = createSelector(selectSilenceRemoverState, (s) => s.inputFile !== null && s.status === 'idle');
