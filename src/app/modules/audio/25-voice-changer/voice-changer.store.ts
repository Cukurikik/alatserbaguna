import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface VoiceChangerState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: VoiceChangerState = {
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
export const VoiceChangerActions = createActionGroup({
  source: '[VoiceChanger]',
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
export const voicechangerReducer = createReducer(
  initialState,
  on(VoiceChangerActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(VoiceChangerActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(VoiceChangerActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(VoiceChangerActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(VoiceChangerActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(VoiceChangerActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectVoiceChangerState = createFeatureSelector<VoiceChangerState>('voice-changer');
export const selectVoiceChangerStatus = createSelector(selectVoiceChangerState, (s) => s.status);
export const selectVoiceChangerProgress = createSelector(selectVoiceChangerState, (s) => s.progress);
export const selectVoiceChangerOutputBlob = createSelector(selectVoiceChangerState, (s) => s.outputBlob);
export const selectVoiceChangerOutputSizeMB = createSelector(selectVoiceChangerState, (s) => s.outputSizeMB);
export const selectVoiceChangerErrorMessage = createSelector(selectVoiceChangerState, (s) => s.errorMessage);
export const selectVoiceChangerRetryable = createSelector(selectVoiceChangerState, (s) => s.retryable);
export const selectVoiceChangerInputFile = createSelector(selectVoiceChangerState, (s) => s.inputFile);
export const selectVoiceChangerIsLoading = createSelector(selectVoiceChangerStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectVoiceChangerIsDone = createSelector(selectVoiceChangerStatus, (s) => s === 'done');
export const selectVoiceChangerHasError = createSelector(selectVoiceChangerStatus, (s) => s === 'error');
export const selectVoiceChangerCanProcess = createSelector(selectVoiceChangerState, (s) => s.inputFile !== null && s.status === 'idle');
