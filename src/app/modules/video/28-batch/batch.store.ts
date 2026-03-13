import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoErrorCode } from '../shared/errors/video.errors';

export type BatchFileStatus = 'queued' | 'processing' | 'done' | 'error';

export interface BatchFileEntry {
  file: File;
  status: BatchFileStatus;
  progress: number;
  outputSizeMB: number | null;
  errorMessage: string | null;
}

export interface BatchState {
  files: BatchFileEntry[];
  operation: string;
  operationConfig: Record<string, unknown>;
  currentIndex: number;
  overallProgress: number;
  status: 'idle' | 'processing' | 'done' | 'paused' | 'error';
  outputBlobs: Blob[];
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: BatchState = {
  files: [], operation: 'compress', operationConfig: {},
  currentIndex: 0, overallProgress: 0,
  status: 'idle', outputBlobs: [], outputSizeMB: null,
  errorCode: null, errorMessage: null, retryable: false,
};

export const BatchActions = createActionGroup({
  source: 'Batch',
  events: {
    'Set Files': props<{ files: File[] }>(),
    'Set Operation': props<{ operation: string }>(),
    'Set Operation Config': props<{ config: Record<string, unknown> }>(),
    'Start Queue': emptyProps(),
    'Pause Queue': emptyProps(),
    'Resume Queue': emptyProps(),
    'File Processing Start': props<{ index: number }>(),
    'File Progress': props<{ index: number; progress: number }>(),
    'File Done': props<{ index: number; blob: Blob; outputSizeMB: number }>(),
    'File Error': props<{ index: number; message: string }>(),
    'Retry File': props<{ index: number }>(),
    'Queue Complete': props<{ outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

export const batchFeature = createFeature({
  name: 'batch',
  reducer: createReducer(
    initialState,
    on(BatchActions.setFiles, (state, { files }) => ({
      ...state,
      files: files.map(f => ({ file: f, status: 'queued' as const, progress: 0, outputSizeMB: null, errorMessage: null })),
      outputBlobs: [],
    })),
    on(BatchActions.setOperation, (state, { operation }) => ({ ...state, operation })),
    on(BatchActions.setOperationConfig, (state, { config }) => ({ ...state, operationConfig: config })),
    on(BatchActions.startQueue, (state) => ({ ...state, status: 'processing' as const, currentIndex: 0, overallProgress: 0, errorCode: null, errorMessage: null })),
    on(BatchActions.pauseQueue, (state) => ({ ...state, status: 'paused' as const })),
    on(BatchActions.resumeQueue, (state) => ({ ...state, status: 'processing' as const })),
    on(BatchActions.fileProcessingStart, (state, { index }) => ({
      ...state, currentIndex: index,
      files: state.files.map((f, i) => i === index ? { ...f, status: 'processing' as const } : f),
    })),
    on(BatchActions.fileProgress, (state, { index, progress }) => ({
      ...state,
      files: state.files.map((f, i) => i === index ? { ...f, progress } : f),
      overallProgress: Math.round(((index + progress / 100) / state.files.length) * 100),
    })),
    on(BatchActions.fileDone, (state, { index, blob, outputSizeMB }) => ({
      ...state,
      outputBlobs: [...state.outputBlobs, blob],
      files: state.files.map((f, i) => i === index ? { ...f, status: 'done' as const, progress: 100, outputSizeMB } : f),
    })),
    on(BatchActions.fileError, (state, { index, message }) => ({
      ...state,
      files: state.files.map((f, i) => i === index ? { ...f, status: 'error' as const, errorMessage: message } : f),
    })),
    on(BatchActions.retryFile, (state, { index }) => ({
      ...state,
      files: state.files.map((f, i) => i === index ? { ...f, status: 'queued' as const, errorMessage: null, progress: 0 } : f),
    })),
    on(BatchActions.queueComplete, (state, { outputSizeMB }) => ({ ...state, status: 'done' as const, overallProgress: 100, outputSizeMB })),
    on(BatchActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable })),
    on(BatchActions.resetState, () => initialState),
  ),
});

export const {
  selectBatchState, selectStatus, selectFiles, selectOperation, selectOperationConfig,
  selectCurrentIndex, selectOverallProgress, selectOutputBlobs, selectOutputSizeMB,
  selectErrorCode, selectErrorMessage, selectRetryable,
} = batchFeature;