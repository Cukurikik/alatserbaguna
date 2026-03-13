import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoMeta } from '../shared/types/video.types';
import { VideoErrorCode } from '../shared/errors/video.errors';

export interface FlipRotateState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  flipH: boolean;
  flipV: boolean;
  rotation: number;
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: FlipRotateState = {
  inputFile: null,
  videoMeta: null,
  flipH: false,
  flipV: false,
  rotation: 0,
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false,
};

export const FlipRotateActions = createActionGroup({
  source: 'FlipRotate',
  events: {
    'Load File': props<{ file: File }>(),
    'Load Meta Success': props<{ meta: VideoMeta }>(),
    'Toggle Flip H': emptyProps(),
    'Toggle Flip V': emptyProps(),
    'Set Rotation': props<{ rotation: number }>(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

export const flipRotateFeature = createFeature({
  name: 'flipRotate',
  reducer: createReducer(
    initialState,
    on(FlipRotateActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'idle', progress: 0 })),
    on(FlipRotateActions.loadMetaSuccess, (state, { meta }) => ({ ...state, videoMeta: meta })),
    on(FlipRotateActions.toggleFlipH, (state) => ({ ...state, flipH: !state.flipH })),
    on(FlipRotateActions.toggleFlipV, (state) => ({ ...state, flipV: !state.flipV })),
    on(FlipRotateActions.setRotation, (state, { rotation }) => ({ ...state, rotation })),
    on(FlipRotateActions.startProcessing, (state) => ({ 
      ...state, 
      status: 'processing', 
      progress: 0, 
      outputBlob: null, 
      errorCode: null, 
      errorMessage: null 
    })),
    on(FlipRotateActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(FlipRotateActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ 
      ...state, 
      status: 'success', 
      outputBlob, 
      outputSizeMB, 
      progress: 100 
    })),
    on(FlipRotateActions.processingFailure, (state, { errorCode, message, retryable }) => ({ 
      ...state, 
      status: 'error', 
      errorCode, 
      errorMessage: message, 
      retryable 
    })),
    on(FlipRotateActions.resetState, () => initialState),
  ),
});

export const {
  selectFlipRotateState,
  selectStatus,
  selectProgress,
  selectInputFile,
  selectVideoMeta,
  selectFlipH,
  selectFlipV,
  selectRotation,
  selectOutputBlob,
  selectOutputSizeMB,
  selectErrorCode,
  selectErrorMessage,
  selectRetryable,
} = flipRotateFeature;