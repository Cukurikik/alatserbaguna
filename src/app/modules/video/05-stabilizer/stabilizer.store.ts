import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoErrorCode } from '../shared/errors/video.errors';
import { VideoMeta } from '../shared/types/video.types';

export interface StabilizerState {
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  smoothing: number;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: StabilizerState = {
  status: 'idle',
  progress: 0,
  inputFile: null,
  videoMeta: null,
  outputBlob: null,
  outputSizeMB: null,
  smoothing: 10,
  errorCode: null,
  errorMessage: null,
  retryable: false,
};

export const StabilizerActions = createActionGroup({
  source: 'Stabilizer',
  events: {
    'Load File': props<{ file: File }>(),
    'Load Meta Success': props<{ meta: VideoMeta }>(),
    'Set Smoothing': props<{ smoothing: number }>(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Download Output': emptyProps(),
    'Reset State': emptyProps(),
  },
});

export const stabilizerFeature = createFeature({
  name: 'stabilizer',
  reducer: createReducer(
    initialState,
    on(StabilizerActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'idle' })),
    on(StabilizerActions.loadMetaSuccess, (state, { meta }) => ({ ...state, videoMeta: meta })),
    on(StabilizerActions.setSmoothing, (state, { smoothing }) => ({ ...state, smoothing })),
    on(StabilizerActions.startProcessing, (state) => ({ 
      ...state, 
      status: 'processing', 
      progress: 0, 
      outputBlob: null, 
      errorCode: null, 
      errorMessage: null 
    })),
    on(StabilizerActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(StabilizerActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ 
      ...state, 
      status: 'success', 
      outputBlob, 
      outputSizeMB, 
      progress: 100 
    })),
    on(StabilizerActions.processingFailure, (state, { errorCode, message, retryable }) => ({ 
      ...state, 
      status: 'error', 
      errorCode, 
      errorMessage: message, 
      retryable 
    })),
    on(StabilizerActions.resetState, () => initialState),
  ),
});

export const {
  selectStabilizerState,
  selectStatus,
  selectProgress,
  selectInputFile,
  selectVideoMeta,
  selectOutputBlob,
  selectOutputSizeMB,
  selectSmoothing,
  selectErrorCode,
  selectErrorMessage,
  selectRetryable,
} = stabilizerFeature;