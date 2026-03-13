import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoMeta } from '../shared/types/video.types';
import { VideoErrorCode } from '../shared/errors/video.errors';

export interface LooperState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  mode: 'count' | 'duration';
  loopCount: number;
  targetDuration: number;
  crossfade: boolean;
  crossfadeDuration: number;
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: LooperState = {
  inputFile: null,
  videoMeta: null,
  mode: 'count',
  loopCount: 3,
  targetDuration: 60,
  crossfade: false,
  crossfadeDuration: 0.5,
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false,
};

export const LooperActions = createActionGroup({
  source: 'Looper',
  events: {
    'Load File': props<{ file: File }>(),
    'Load Meta Success': props<{ meta: VideoMeta }>(),
    'Set Mode': props<{ mode: 'count' | 'duration' }>(),
    'Set Loop Count': props<{ count: number }>(),
    'Set Target Duration': props<{ duration: number }>(),
    'Set Crossfade': props<{ enabled: boolean }>(),
    'Set Crossfade Duration': props<{ duration: number }>(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

export const looperFeature = createFeature({
  name: 'looper',
  reducer: createReducer(
    initialState,
    on(LooperActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'idle', progress: 0 })),
    on(LooperActions.loadMetaSuccess, (state, { meta }) => ({ ...state, videoMeta: meta })),
    on(LooperActions.setMode, (state, { mode }) => ({ ...state, mode })),
    on(LooperActions.setLoopCount, (state, { count }) => ({ ...state, loopCount: count })),
    on(LooperActions.setTargetDuration, (state, { duration }) => ({ ...state, targetDuration: duration })),
    on(LooperActions.setCrossfade, (state, { enabled }) => ({ ...state, crossfade: enabled })),
    on(LooperActions.setCrossfadeDuration, (state, { duration }) => ({ ...state, crossfadeDuration: duration })),
    on(LooperActions.startProcessing, (state) => ({ 
      ...state, 
      status: 'processing', 
      progress: 0, 
      outputBlob: null, 
      errorCode: null, 
      errorMessage: null 
    })),
    on(LooperActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(LooperActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ 
      ...state, 
      status: 'success', 
      outputBlob, 
      outputSizeMB, 
      progress: 100 
    })),
    on(LooperActions.processingFailure, (state, { errorCode, message, retryable }) => ({ 
      ...state, 
      status: 'error', 
      errorCode, 
      errorMessage: message, 
      retryable 
    })),
    on(LooperActions.resetState, () => initialState),
  ),
});

export const {
  selectLooperState,
  selectStatus,
  selectProgress,
  selectInputFile,
  selectVideoMeta,
  selectMode,
  selectLoopCount,
  selectTargetDuration,
  selectCrossfade,
  selectCrossfadeDuration,
  selectOutputBlob,
  selectOutputSizeMB,
  selectErrorCode,
  selectErrorMessage,
  selectRetryable,
} = looperFeature;