import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface ChannelMixerState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: ChannelMixerState = {
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
export const ChannelMixerActions = createActionGroup({
  source: '[ChannelMixer]',
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
export const channelmixerReducer = createReducer(
  initialState,
  on(ChannelMixerActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(ChannelMixerActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(ChannelMixerActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(ChannelMixerActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(ChannelMixerActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(ChannelMixerActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectChannelMixerState = createFeatureSelector<ChannelMixerState>('channel-mixer');
export const selectChannelMixerStatus = createSelector(selectChannelMixerState, (s) => s.status);
export const selectChannelMixerProgress = createSelector(selectChannelMixerState, (s) => s.progress);
export const selectChannelMixerOutputBlob = createSelector(selectChannelMixerState, (s) => s.outputBlob);
export const selectChannelMixerOutputSizeMB = createSelector(selectChannelMixerState, (s) => s.outputSizeMB);
export const selectChannelMixerErrorMessage = createSelector(selectChannelMixerState, (s) => s.errorMessage);
export const selectChannelMixerRetryable = createSelector(selectChannelMixerState, (s) => s.retryable);
export const selectChannelMixerInputFile = createSelector(selectChannelMixerState, (s) => s.inputFile);
export const selectChannelMixerIsLoading = createSelector(selectChannelMixerStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectChannelMixerIsDone = createSelector(selectChannelMixerStatus, (s) => s === 'done');
export const selectChannelMixerHasError = createSelector(selectChannelMixerStatus, (s) => s === 'error');
export const selectChannelMixerCanProcess = createSelector(selectChannelMixerState, (s) => s.inputFile !== null && s.status === 'idle');
