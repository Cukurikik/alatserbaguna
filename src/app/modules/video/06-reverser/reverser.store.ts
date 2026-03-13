import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoMeta } from '../shared/types/video.types';
import { VideoErrorCode } from '../shared/errors/video.errors';

export interface ReverserState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  reverseAudio: boolean;
  durationWarning: boolean;
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: ReverserState = {
  inputFile: null,
  videoMeta: null,
  reverseAudio: true,
  durationWarning: false,
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false,
};

export const ReverserActions = createActionGroup({
  source: 'Reverser',
  events: {
    'Load File': props<{ file: File }>(),
    'Load Meta Success': props<{ meta: VideoMeta }>(),
    'Set Reverse Audio': props<{ reverseAudio: boolean }>(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

export const reverserFeature = createFeature({
  name: 'reverser',
  reducer: createReducer(
    initialState,
    on(ReverserActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'idle', progress: 0 })),
    on(ReverserActions.loadMetaSuccess, (state, { meta }) => ({
      ...state, videoMeta: meta,
      durationWarning: meta.duration > 120,
    })),
    on(ReverserActions.setReverseAudio, (state, { reverseAudio }) => ({ ...state, reverseAudio })),
    on(ReverserActions.startProcessing, (state) => ({ 
      ...state, 
      status: 'processing', 
      progress: 0, 
      outputBlob: null, 
      errorCode: null, 
      errorMessage: null 
    })),
    on(ReverserActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(ReverserActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({
      ...state, status: 'success', outputBlob, outputSizeMB, progress: 100,
    })),
    on(ReverserActions.processingFailure, (state, { errorCode, message, retryable }) => ({
      ...state, status: 'error', errorCode, errorMessage: message, retryable,
    })),
    on(ReverserActions.resetState, () => initialState),
  ),
});

export const {
  selectReverserState,
  selectStatus,
  selectProgress,
  selectInputFile,
  selectVideoMeta,
  selectReverseAudio,
  selectDurationWarning,
  selectOutputBlob,
  selectOutputSizeMB,
  selectErrorCode,
  selectErrorMessage,
  selectRetryable,
} = reverserFeature;