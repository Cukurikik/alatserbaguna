import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoErrorCode } from '../shared/errors/video.errors';

export interface CompareState {
  fileA: File | null;
  fileB: File | null;
  mode: 'sidebyside' | 'divider' | 'difference';
  dividerPosition: number; // 0–100 (% from left)
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: CompareState = {
  fileA: null, fileB: null, mode: 'divider', dividerPosition: 50,
  status: 'idle', progress: 0, outputBlob: null, outputSizeMB: null,
  errorCode: null, errorMessage: null, retryable: false,
};

export const CompareActions = createActionGroup({
  source: 'Compare',
  events: {
    'Load File A': props<{ file: File }>(),
    'Load File B': props<{ file: File }>(),
    'Set Mode': props<{ mode: 'sidebyside' | 'divider' | 'difference' }>(),
    'Set Divider Position': props<{ position: number }>(),
    'Export': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

export const compareFeature = createFeature({
  name: 'compare',
  reducer: createReducer(
    initialState,
    on(CompareActions.loadFileA, (state, { file }) => ({ ...state, fileA: file })),
    on(CompareActions.loadFileB, (state, { file }) => ({ ...state, fileB: file })),
    on(CompareActions.setMode, (state, { mode }) => ({ ...state, mode })),
    on(CompareActions.setDividerPosition, (state, { position }) => ({ ...state, dividerPosition: position })),
    on(CompareActions.export, (state) => ({ ...state, status: 'processing' as const, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
    on(CompareActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(CompareActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as const, outputBlob, outputSizeMB, progress: 100 })),
    on(CompareActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable })),
    on(CompareActions.resetState, () => initialState),
  ),
});

export const {
  selectCompareState, selectStatus, selectProgress, selectFileA, selectFileB,
  selectMode, selectDividerPosition,
  selectOutputBlob, selectOutputSizeMB, selectErrorCode, selectErrorMessage, selectRetryable,
} = compareFeature;