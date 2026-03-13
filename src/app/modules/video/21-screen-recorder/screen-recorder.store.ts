import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoErrorCode } from '../shared/errors/video.errors';

export interface ScreenRecorderState {
  audioSource: 'mic' | 'system' | 'both' | 'none';
  resolution: '1080p' | '720p' | '480p';
  outputFormat: 'mp4' | 'webm';
  recording: boolean;
  paused: boolean;
  elapsedSeconds: number;
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: ScreenRecorderState = {
  audioSource: 'mic', resolution: '1080p', outputFormat: 'webm',
  recording: false, paused: false, elapsedSeconds: 0,
  status: 'idle', progress: 0, outputBlob: null, outputSizeMB: null,
  errorCode: null, errorMessage: null, retryable: false,
};

export const ScreenRecorderActions = createActionGroup({
  source: 'ScreenRecorder',
  events: {
    'Set Audio Source': props<{ audioSource: 'mic' | 'system' | 'both' | 'none' }>(),
    'Set Resolution': props<{ resolution: '1080p' | '720p' | '480p' }>(),
    'Set Output Format': props<{ outputFormat: 'mp4' | 'webm' }>(),
    'Start Recording': emptyProps(),
    'Pause Recording': emptyProps(),
    'Resume Recording': emptyProps(),
    'Stop Recording': emptyProps(),
    'Tick Elapsed': emptyProps(),
    'Recording Captured': props<{ rawBlob: Blob }>(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

export const screenRecorderFeature = createFeature({
  name: 'screenRecorder',
  reducer: createReducer(
    initialState,
    on(ScreenRecorderActions.setAudioSource, (state, { audioSource }) => ({ ...state, audioSource })),
    on(ScreenRecorderActions.setResolution, (state, { resolution }) => ({ ...state, resolution })),
    on(ScreenRecorderActions.setOutputFormat, (state, { outputFormat }) => ({ ...state, outputFormat })),
    on(ScreenRecorderActions.startRecording, (state) => ({ ...state, recording: true, paused: false, elapsedSeconds: 0, outputBlob: null })),
    on(ScreenRecorderActions.pauseRecording, (state) => ({ ...state, paused: true })),
    on(ScreenRecorderActions.resumeRecording, (state) => ({ ...state, paused: false })),
    on(ScreenRecorderActions.stopRecording, (state) => ({ ...state, recording: false, paused: false })),
    on(ScreenRecorderActions.tickElapsed, (state) => ({ ...state, elapsedSeconds: state.elapsedSeconds + 1 })),
    on(ScreenRecorderActions.recordingCaptured, (state) => ({ ...state, status: 'processing' as const, progress: 0 })),
    on(ScreenRecorderActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(ScreenRecorderActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as const, outputBlob, outputSizeMB, progress: 100 })),
    on(ScreenRecorderActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable })),
    on(ScreenRecorderActions.resetState, () => initialState),
  ),
});

export const {
  selectScreenRecorderState, selectStatus, selectProgress,
  selectAudioSource, selectResolution, selectOutputFormat,
  selectRecording, selectPaused, selectElapsedSeconds,
  selectOutputBlob, selectOutputSizeMB, selectErrorCode, selectErrorMessage, selectRetryable,
} = screenRecorderFeature;