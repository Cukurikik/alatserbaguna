import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface MixerState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: MixerState = {
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
export const MixerActions = createActionGroup({
  source: '[Mixer]',
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
export const mixerReducer = createReducer(
  initialState,
  on(MixerActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(MixerActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(MixerActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(MixerActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(MixerActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(MixerActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectMixerState = createFeatureSelector<MixerState>('mixer');
export const selectMixerStatus = createSelector(selectMixerState, (s) => s.status);
export const selectMixerProgress = createSelector(selectMixerState, (s) => s.progress);
export const selectMixerOutputBlob = createSelector(selectMixerState, (s) => s.outputBlob);
export const selectMixerOutputSizeMB = createSelector(selectMixerState, (s) => s.outputSizeMB);
export const selectMixerErrorMessage = createSelector(selectMixerState, (s) => s.errorMessage);
export const selectMixerRetryable = createSelector(selectMixerState, (s) => s.retryable);
export const selectMixerInputFile = createSelector(selectMixerState, (s) => s.inputFile);
export const selectMixerIsLoading = createSelector(selectMixerStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectMixerIsDone = createSelector(selectMixerStatus, (s) => s === 'done');
export const selectMixerHasError = createSelector(selectMixerStatus, (s) => s === 'error');
export const selectMixerCanProcess = createSelector(selectMixerState, (s) => s.inputFile !== null && s.status === 'idle');
