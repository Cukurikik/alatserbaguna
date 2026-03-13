import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface MergerState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: MergerState = {
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
export const MergerActions = createActionGroup({
  source: '[Merger]',
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
export const mergerReducer = createReducer(
  initialState,
  on(MergerActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(MergerActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(MergerActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(MergerActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(MergerActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(MergerActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectMergerState = createFeatureSelector<MergerState>('merger');
export const selectMergerStatus = createSelector(selectMergerState, (s) => s.status);
export const selectMergerProgress = createSelector(selectMergerState, (s) => s.progress);
export const selectMergerOutputBlob = createSelector(selectMergerState, (s) => s.outputBlob);
export const selectMergerOutputSizeMB = createSelector(selectMergerState, (s) => s.outputSizeMB);
export const selectMergerErrorMessage = createSelector(selectMergerState, (s) => s.errorMessage);
export const selectMergerRetryable = createSelector(selectMergerState, (s) => s.retryable);
export const selectMergerInputFile = createSelector(selectMergerState, (s) => s.inputFile);
export const selectMergerIsLoading = createSelector(selectMergerStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectMergerIsDone = createSelector(selectMergerStatus, (s) => s === 'done');
export const selectMergerHasError = createSelector(selectMergerStatus, (s) => s === 'error');
export const selectMergerCanProcess = createSelector(selectMergerState, (s) => s.inputFile !== null && s.status === 'idle');
