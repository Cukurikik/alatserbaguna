import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoMeta } from '../shared/types/video.types';
import { VideoErrorCode } from '../shared/errors/video.errors';

export interface SpeedControllerState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  speed: number;
  audioMode: 'keep' | 'mute' | 'pitchCorrect';
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: SpeedControllerState = {
  inputFile: null,
  videoMeta: null,
  speed: 1.0,
  audioMode: 'keep',
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false,
};

export const SpeedControllerActions = createActionGroup({
  source: 'SpeedController',
  events: {
    'Load File': props<{ file: File }>(),
    'Load Meta Success': props<{ meta: VideoMeta }>(),
    'Load Meta Failure': props<{ errorCode: VideoErrorCode; message: string }>(),
    'Set Speed': props<{ speed: number }>(),
    'Set Audio Mode': props<{ audioMode: 'keep' | 'mute' | 'pitchCorrect' }>(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

export const speedControllerFeature = createFeature({
  name: 'speedController',
  reducer: createReducer(
    initialState,
    on(SpeedControllerActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'processing' as const, progress: 0 })),
    on(SpeedControllerActions.loadMetaSuccess, (state, { meta }) => ({ ...state, videoMeta: meta, status: 'idle' as const })),
    on(SpeedControllerActions.loadMetaFailure, (state, { errorCode, message }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable: true })),
    on(SpeedControllerActions.setSpeed, (state, { speed }) => ({ ...state, speed })),
    on(SpeedControllerActions.setAudioMode, (state, { audioMode }) => ({ ...state, audioMode })),
    on(SpeedControllerActions.startProcessing, (state) => ({ ...state, status: 'processing' as const, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
    on(SpeedControllerActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(SpeedControllerActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as const, outputBlob, outputSizeMB, progress: 100 })),
    on(SpeedControllerActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable })),
    on(SpeedControllerActions.resetState, () => initialState),
  ),
});

export const {
  selectSpeedControllerState, selectStatus, selectProgress, selectInputFile,
  selectVideoMeta, selectSpeed, selectAudioMode,
  selectOutputBlob, selectOutputSizeMB, selectErrorCode, selectErrorMessage, selectRetryable,
} = speedControllerFeature;