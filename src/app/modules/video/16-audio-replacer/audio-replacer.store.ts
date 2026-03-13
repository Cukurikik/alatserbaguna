import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoMeta } from '../shared/types/video.types';
import { VideoErrorCode } from '../shared/errors/video.errors';

export interface AudioReplacerState {
  videoFile: File | null;
  audioFile: File | null;
  videoMeta: VideoMeta | null;
  mode: 'replace' | 'mix';
  originalVolume: number;
  newAudioVolume: number;
  loopAudio: boolean;
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: AudioReplacerState = {
  videoFile: null,
  audioFile: null,
  videoMeta: null,
  mode: 'replace',
  originalVolume: 1.0,
  newAudioVolume: 1.0,
  loopAudio: false,
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false,
};

export const AudioReplacerActions = createActionGroup({
  source: 'AudioReplacer',
  events: {
    'Load Video': props<{ file: File }>(),
    'Load Audio': props<{ file: File }>(),
    'Load Meta Success': props<{ meta: VideoMeta }>(),
    'Set Mode': props<{ mode: 'replace' | 'mix' }>(),
    'Set Original Volume': props<{ volume: number }>(),
    'Set New Audio Volume': props<{ volume: number }>(),
    'Toggle Loop Audio': emptyProps(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

export const audioReplacerFeature = createFeature({
  name: 'audioReplacer',
  reducer: createReducer(
    initialState,
    on(AudioReplacerActions.loadVideo, (state, { file }) => ({ ...state, videoFile: file, status: 'idle', progress: 0 })),
    on(AudioReplacerActions.loadAudio, (state, { file }) => ({ ...state, audioFile: file })),
    on(AudioReplacerActions.loadMetaSuccess, (state, { meta }) => ({ ...state, videoMeta: meta })),
    on(AudioReplacerActions.setMode, (state, { mode }) => ({ ...state, mode })),
    on(AudioReplacerActions.setOriginalVolume, (state, { volume }) => ({ ...state, originalVolume: volume })),
    on(AudioReplacerActions.setNewAudioVolume, (state, { volume }) => ({ ...state, newAudioVolume: volume })),
    on(AudioReplacerActions.toggleLoopAudio, (state) => ({ ...state, loopAudio: !state.loopAudio })),
    on(AudioReplacerActions.startProcessing, (state) => ({ 
      ...state, 
      status: 'processing', 
      progress: 0, 
      outputBlob: null, 
      errorCode: null, 
      errorMessage: null 
    })),
    on(AudioReplacerActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(AudioReplacerActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ 
      ...state, 
      status: 'success', 
      outputBlob, 
      outputSizeMB, 
      progress: 100 
    })),
    on(AudioReplacerActions.processingFailure, (state, { errorCode, message, retryable }) => ({ 
      ...state, 
      status: 'error', 
      errorCode, 
      errorMessage: message, 
      retryable 
    })),
    on(AudioReplacerActions.resetState, () => initialState),
  ),
});

export const {
  selectAudioReplacerState,
  selectStatus,
  selectProgress,
  selectVideoFile,
  selectAudioFile,
  selectVideoMeta,
  selectMode,
  selectOriginalVolume,
  selectNewAudioVolume,
  selectLoopAudio,
  selectOutputBlob,
  selectOutputSizeMB,
  selectErrorCode,
  selectErrorMessage,
  selectRetryable,
} = audioReplacerFeature;