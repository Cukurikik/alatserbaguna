import { createActionGroup, emptyProps, props, createReducer, on, createFeature, createSelector } from '@ngrx/store';
import { VideoMeta } from '../shared/types/video.types';
import { VideoErrorCode, VideoErrorMessages } from '../shared/errors/video.errors';

export interface TrimmerState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  startTime: number;
  endTime: number;
  outputFormat: 'mp4' | 'webm' | 'mov';
  status: 'idle' | 'loading' | 'processing' | 'done' | 'error';
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}


const initialState: TrimmerState = {
  inputFile: null,
  videoMeta: null,
  startTime: 0,
  endTime: 0,
  outputFormat: 'mp4',
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false
};

export const TrimmerActions = createActionGroup({
  source: 'Trimmer',
  events: {
    loadFile: props<{ file: File }>(),
    clearFile: emptyProps(),
    updateConfig: props<{ config: Partial<TrimmerState> }>(),
    startProcessing: emptyProps(),
    updateProgress: props<{ progress: number }>(),
    processingSuccess: props<{ outputBlob: Blob; outputSizeMB: number }>(),
    processingFailure: props<{ errorCode: VideoErrorCode; message: string }>(),
    downloadOutput: emptyProps(),
    resetState: emptyProps(),
    loadMetaSuccess: props<{ meta: VideoMeta }>(),
    loadMetaFailure: props<{ errorCode: VideoErrorCode }>()
  }
});

export const trimmerReducer = createReducer(
  initialState,
  on(TrimmerActions.loadFile, (state, { file }) => ({
    ...state,
    inputFile: file,
    status: 'loading',
    outputBlob: null,
    errorMessage: null,
    progress: 0
  })),
  on(TrimmerActions.loadMetaSuccess, (state, { meta }) => ({
    ...state,
    videoMeta: meta,
    endTime: meta.duration,
    status: 'idle'
  })),
  on(TrimmerActions.loadMetaFailure, (state, { errorCode }) => ({
    ...state,
    status: 'error',
    errorCode,
    errorMessage: VideoErrorMessages[errorCode]
  })),
  on(TrimmerActions.updateConfig, (state, { config }) => ({
    ...state,
    ...config
  })),
  on(TrimmerActions.startProcessing, (state) => ({
    ...state,
    status: 'processing',
    progress: 0,
    outputBlob: null,
    errorMessage: null
  })),
  on(TrimmerActions.updateProgress, (state, { progress }) => ({
    ...state,
    progress
  })),
  on(TrimmerActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({
    ...state,
    status: 'done',
    progress: 100,
    outputBlob,
    outputSizeMB
  })),
  on(TrimmerActions.processingFailure, (state, { errorCode, message }) => ({
    ...state,
    status: 'error',
    errorCode,
    errorMessage: message
  })),
  on(TrimmerActions.resetState, () => initialState)
);

export const trimmerFeature = createFeature({
  name: 'trimmer',
  reducer: trimmerReducer,
});

export const {
  selectTrimmerState,
  selectInputFile,
  selectVideoMeta,
  selectStatus,
  selectProgress,
  selectOutputBlob,
  selectOutputSizeMB,
  selectErrorCode,
  selectErrorMessage,
  selectRetryable
} = trimmerFeature;

export const selectIsLoading = createSelector(
  selectStatus,
  (status) => status === 'processing' || status === 'loading'
);

export const selectIsDone = createSelector(
  selectStatus,
  (status) => status === 'done'
);

export const selectHasError = createSelector(
  selectStatus,
  (status) => status === 'error'
);

export const selectCanProcess = createSelector(
  selectInputFile,
  selectStatus,
  selectVideoMeta,
  (file, status, meta) => file !== null && status === 'idle' && meta !== null
);
