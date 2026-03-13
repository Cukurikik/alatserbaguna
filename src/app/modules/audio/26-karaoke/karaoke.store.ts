import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface KaraokeState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: KaraokeState = {
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
export const KaraokeActions = createActionGroup({
  source: '[Karaoke]',
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
export const karaokeReducer = createReducer(
  initialState,
  on(KaraokeActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(KaraokeActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(KaraokeActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(KaraokeActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(KaraokeActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(KaraokeActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectKaraokeState = createFeatureSelector<KaraokeState>('karaoke');
export const selectKaraokeStatus = createSelector(selectKaraokeState, (s) => s.status);
export const selectKaraokeProgress = createSelector(selectKaraokeState, (s) => s.progress);
export const selectKaraokeOutputBlob = createSelector(selectKaraokeState, (s) => s.outputBlob);
export const selectKaraokeOutputSizeMB = createSelector(selectKaraokeState, (s) => s.outputSizeMB);
export const selectKaraokeErrorMessage = createSelector(selectKaraokeState, (s) => s.errorMessage);
export const selectKaraokeRetryable = createSelector(selectKaraokeState, (s) => s.retryable);
export const selectKaraokeInputFile = createSelector(selectKaraokeState, (s) => s.inputFile);
export const selectKaraokeIsLoading = createSelector(selectKaraokeStatus, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const selectKaraokeIsDone = createSelector(selectKaraokeStatus, (s) => s === 'done');
export const selectKaraokeHasError = createSelector(selectKaraokeStatus, (s) => s === 'error');
export const selectKaraokeCanProcess = createSelector(selectKaraokeState, (s) => s.inputFile !== null && s.status === 'idle');
