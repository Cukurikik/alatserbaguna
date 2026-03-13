import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoMeta } from '../shared/types/video.types';
import { VideoErrorCode } from '../shared/errors/video.errors';
import { UpscaleModel } from './upscaler.service';

export interface UpscalerState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  scaleFactor: 2 | 4;
  model: UpscaleModel;
  webGpuAvailable: boolean;
  modelDownloaded: boolean;
  modelDownloadProgress: number;
  framesTotal: number;
  framesCompleted: number;
  avgFrameTimeMs: number;
  estimatedTimeRemaining: string;
  processingSpeedFps: number;
  status: 'idle' | 'downloading' | 'processing' | 'success' | 'error';
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: UpscalerState = {
  inputFile: null,
  videoMeta: null,
  scaleFactor: 4,
  model: 'realesrgan',
  webGpuAvailable: false,
  modelDownloaded: false,
  modelDownloadProgress: 0,
  framesTotal: 0,
  framesCompleted: 0,
  avgFrameTimeMs: 0,
  estimatedTimeRemaining: '',
  processingSpeedFps: 0,
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false,
};

export const UpscalerActions = createActionGroup({
  source: 'Upscaler',
  events: {
    'Load File': props<{ file: File }>(),
    'Load Meta Success': props<{ meta: VideoMeta; framesTotal: number }>(),
    'Load Meta Failure': props<{ errorCode: VideoErrorCode; message: string }>(),
    'Set Web GPU Available': props<{ available: boolean }>(),
    'Set Scale Factor': props<{ scaleFactor: 2 | 4 }>(),
    'Set Model': props<{ model: UpscaleModel }>(),
    'Set Model Downloaded': props<{ downloaded: boolean }>(),
    'Model Download Progress': props<{ progress: number }>(),
    'Start Processing': emptyProps(),
    'Frame Complete': props<{ framesCompleted: number; avgFrameTimeMs: number; speedFps: number; eta: string }>(),
    'Initialize Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Abort Processing': emptyProps(),
    'Reset State': emptyProps(),
  },
});

export const upscalerFeature = createFeature({
  name: 'upscaler',
  reducer: createReducer(
    initialState,
    on(UpscalerActions.loadFile, (state, { file }) => ({ 
      ...state, 
      inputFile: file, 
      status: 'processing' as const,
      errorCode: null,
      errorMessage: null
    })),
    on(UpscalerActions.loadMetaSuccess, (state, { meta, framesTotal }) => ({ 
      ...state, 
      videoMeta: meta, 
      framesTotal, 
      status: 'idle' as const 
    })),
    on(UpscalerActions.loadMetaFailure, (state, { errorCode, message }) => ({ 
      ...state, 
      status: 'error' as const, 
      errorCode, 
      errorMessage: message, 
      retryable: true 
    })),
    on(UpscalerActions.setWebGPUAvailable, (state, { available }) => ({ ...state, webGpuAvailable: available })),
    on(UpscalerActions.setScaleFactor, (state, { scaleFactor }) => ({ ...state, scaleFactor })),
    on(UpscalerActions.setModel, (state, { model }) => ({ ...state, model })),
    on(UpscalerActions.setModelDownloaded, (state, { downloaded }) => ({ ...state, modelDownloaded: downloaded })),
    on(UpscalerActions.modelDownloadProgress, (state, { progress }) => ({ 
      ...state, 
      modelDownloadProgress: progress, 
      status: 'downloading' as const 
    })),
    on(UpscalerActions.startProcessing, (state) => ({ 
      ...state, 
      status: 'processing' as const, 
      progress: 0, 
      framesCompleted: 0, 
      outputBlob: null, 
      errorCode: null, 
      errorMessage: null 
    })),
    on(UpscalerActions.frameComplete, (state, { framesCompleted, avgFrameTimeMs, speedFps, eta }) => ({
      ...state,
      framesCompleted,
      avgFrameTimeMs,
      processingSpeedFps: speedFps,
      estimatedTimeRemaining: eta,
      progress: Math.round((framesCompleted / Math.max(state.framesTotal, 1)) * 100),
    })),
    on(UpscalerActions.initializeProgress, (state, { progress }) => ({ ...state, progress })),
    on(UpscalerActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ 
      ...state, 
      status: 'success' as const, 
      outputBlob, 
      outputSizeMB, 
      progress: 100 
    })),
    on(UpscalerActions.processingFailure, (state, { errorCode, message, retryable }) => ({ 
      ...state, 
      status: 'error' as const, 
      errorCode, 
      errorMessage: message, 
      retryable 
    })),
    on(UpscalerActions.abortProcessing, (state) => ({ 
      ...state, 
      status: 'idle' as const, 
      progress: 0 
    })),
    on(UpscalerActions.resetState, () => initialState),
  ),
});

export const {
  selectUpscalerState,
  selectStatus,
  selectProgress,
  selectInputFile,
  selectVideoMeta,
  selectScaleFactor,
  selectModel,
  selectWebGpuAvailable,
  selectModelDownloaded,
  selectModelDownloadProgress,
  selectFramesTotal,
  selectFramesCompleted,
  selectAvgFrameTimeMs,
  selectEstimatedTimeRemaining,
  selectProcessingSpeedFps,
  selectOutputBlob,
  selectOutputSizeMB,
  selectErrorCode,
  selectErrorMessage,
  selectRetryable,
} = upscalerFeature;