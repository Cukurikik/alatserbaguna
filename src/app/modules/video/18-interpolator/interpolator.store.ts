import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoMeta } from '../shared/types/video.types';
import { VideoErrorCode } from '../shared/errors/video.errors';

export interface InterpolatorState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  targetFPS: '24' | '30' | '60' | '120';
  algorithm: 'duplicate' | 'motion';
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: InterpolatorState = {
  inputFile: null,
  videoMeta: null,
  targetFPS: '60',
  algorithm: 'duplicate',
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false,
};

export const InterpolatorActions = createActionGroup({
  source: 'Interpolator',
  events: {
    'Load File': props<{ file: File }>(),
    'Load Meta Success': props<{ meta: VideoMeta }>(),
    'Set Target FPS': props<{ targetFPS: '24' | '30' | '60' | '120' }>(),
    'Set Algorithm': props<{ algorithm: 'duplicate' | 'motion' }>(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

export const interpolatorFeature = createFeature({
  name: 'interpolator',
  reducer: createReducer(
    initialState,
    on(InterpolatorActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'idle', progress: 0 })),
    on(InterpolatorActions.loadMetaSuccess, (state, { meta }) => ({ ...state, videoMeta: meta })),
    on(InterpolatorActions.setTargetFPS, (state, { targetFPS }) => ({ ...state, targetFPS })),
    on(InterpolatorActions.setAlgorithm, (state, { algorithm }) => ({ ...state, algorithm })),
    on(InterpolatorActions.startProcessing, (state) => ({ 
      ...state, 
      status: 'processing', 
      progress: 0, 
      outputBlob: null, 
      errorCode: null, 
      errorMessage: null 
    })),
    on(InterpolatorActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(InterpolatorActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ 
      ...state, 
      status: 'success', 
      outputBlob, 
      outputSizeMB, 
      progress: 100 
    })),
    on(InterpolatorActions.processingFailure, (state, { errorCode, message, retryable }) => ({ 
      ...state, 
      status: 'error', 
      errorCode, 
      errorMessage: message, 
      retryable 
    })),
    on(InterpolatorActions.resetState, () => initialState),
  ),
});

export const {
  selectInterpolatorState,
  selectStatus,
  selectProgress,
  selectInputFile,
  selectVideoMeta,
  selectTargetFPS,
  selectAlgorithm,
  selectOutputBlob,
  selectOutputSizeMB,
  selectErrorCode,
  selectErrorMessage,
  selectRetryable,
} = interpolatorFeature;