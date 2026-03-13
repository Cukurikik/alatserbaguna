import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoMeta } from '../shared/types/video.types';
import { VideoErrorCode } from '../shared/errors/video.errors';

export interface TrimmerState {
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  startTime: number;
  endTime: number;
  outputFormat: string;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: TrimmerState = {
  status: 'idle',
  progress: 0,
  inputFile: null,
  videoMeta: null,
  outputBlob: null,
  outputSizeMB: null,
  startTime: 0,
  endTime: 0,
  outputFormat: 'mp4',
  errorCode: null,
  errorMessage: null,
  retryable: false,
};

export const TrimmerActions = createActionGroup({
  source: 'Trimmer',
  events: {
    'Load File': props<{ file: File }>(),
    'Load Meta Success': props<{ meta: VideoMeta }>(),
    'Load Meta Failure': props<{ errorCode: VideoErrorCode; message: string }>(),
    'Set Start Time': props<{ time: number }>(),
    'Set End Time': props<{ time: number }>(),
    'Set Output Format': props<{ format: string }>(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Download Output': emptyProps(),
    'Reset State': emptyProps(),
  },
});

export const trimmerFeature = createFeature({
  name: 'trimmer',
  reducer: createReducer(
    initialState,
    on(TrimmerActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'processing', progress: 0 })),
    on(TrimmerActions.loadMetaSuccess, (state, { meta }) => ({ 
      ...state, 
      videoMeta: meta,
      startTime: 0, 
      endTime: meta.duration, 
      status: 'idle' 
    })),
    on(TrimmerActions.loadMetaFailure, (state, { errorCode, message }) => ({ 
      ...state, 
      status: 'error', 
      errorCode, 
      errorMessage: message, 
      retryable: true 
    })),
    on(TrimmerActions.setStartTime, (state, { time }) => ({ ...state, startTime: time })),
    on(TrimmerActions.setEndTime, (state, { time }) => ({ ...state, endTime: time })),
    on(TrimmerActions.setOutputFormat, (state, { format }) => ({ ...state, outputFormat: format })),
    on(TrimmerActions.startProcessing, (state) => ({ 
      ...state, 
      status: 'processing', 
      progress: 0, 
      outputBlob: null, 
      errorCode: null, 
      errorMessage: null 
    })),
    on(TrimmerActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(TrimmerActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ 
      ...state, 
      status: 'success', 
      outputBlob, 
      outputSizeMB, 
      progress: 100 
    })),
    on(TrimmerActions.processingFailure, (state, { errorCode, message, retryable }) => ({ 
      ...state, 
      status: 'error', 
      errorCode, 
      errorMessage: message, 
      retryable 
    })),
    on(TrimmerActions.resetState, () => initialState),
  ),
});

export const {
  selectTrimmerState,
  selectStatus,
  selectProgress,
  selectInputFile,
  selectVideoMeta,
  selectOutputBlob,
  selectOutputSizeMB,
  selectStartTime,
  selectEndTime,
  selectOutputFormat,
  selectErrorCode,
  selectErrorMessage,
  selectRetryable,
} = trimmerFeature;