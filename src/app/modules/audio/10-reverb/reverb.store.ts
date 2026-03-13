import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface ReverbState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: ReverbState = {
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
export const ReverbActions = createActionGroup({
  source: '[Reverb]',
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
export const reverbReducer = createReducer(
  initialState,
  on(ReverbActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(ReverbActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(ReverbActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(ReverbActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(ReverbActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(ReverbActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectReverbState = createFeatureSelector<ReverbState>('reverb');
export const selectReverbStatus = createSelector(selectReverbState, (s) => s.status);
export const selectReverbProgress = createSelector(selectReverbState, (s) => s.progress);
export const selectReverbOutputBlob = createSelector(selectReverbState, (s) => s.outputBlob);
export const selectReverbOutputSizeMB = createSelector(selectReverbState, (s) => s.outputSizeMB);
export const selectReverbErrorMessage = createSelector(selectReverbState, (s) => s.errorMessage);
export const selectReverbRetryable = createSelector(selectReverbState, (s) => s.retryable);
export const selectReverbInputFile = createSelector(selectReverbState, (s) => s.inputFile);
export const selectReverbIsLoading = createSelector(selectReverbStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectReverbIsDone = createSelector(selectReverbStatus, (s) => s === 'done');
export const selectReverbHasError = createSelector(selectReverbStatus, (s) => s === 'error');
export const selectReverbCanProcess = createSelector(selectReverbState, (s) => s.inputFile !== null && s.status === 'idle');
