import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoMeta, VideoErrorCode } from '../shared/types/video.types';

export interface AudioReplacerState {
  videoFile: File | null;
  audioFile: File | null;
  videoMeta: VideoMeta | null;
  mode: 'replace' | 'mix';
  originalVolume: number;
  newAudioVolume: number;
  loopAudio: boolean;
  durationConflict: 'ok' | 'shorter' | 'longer';
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: AudioReplacerState = {
  videoFile: null, audioFile: null, videoMeta: null,
  mode: 'replace', originalVolume: 1.0, newAudioVolume: 1.0,
  loopAudio: false, durationConflict: 'ok',
  status: 'idle', progress: 0, outputBlob: null, outputSizeMB: null,
  errorCode: null, errorMessage: null, retryable: false,
};

export const AudioReplacerActions = createActionGroup({
  source: 'AudioReplacer',
  events: {
    'Load Video': props<{ file: File }>(),
    'Load Audio': props<{ file: File }>(),
    'Load Meta Success': props<{ meta: VideoMeta }>(),
    'Load Meta Failure': props<{ errorCode: VideoErrorCode; message: string }>(),
    'Set Mode': props<{ mode: 'replace' | 'mix' }>(),
    'Set Original Volume': props<{ volume: number }>(),
    'Set New Audio Volume': props<{ volume: number }>(),
    'Toggle Loop Audio': emptyProps(),
    'Set Duration Conflict': props<{ conflict: 'ok' | 'shorter' | 'longer' }>(),
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
    on(AudioReplacerActions.loadVideo, (state, { file }) => ({ ...state, videoFile: file })),
    on(AudioReplacerActions.loadAudio, (state, { file }) => ({ ...state, audioFile: file })),
    on(AudioReplacerActions.loadMetaSuccess, (state, { meta }) => ({ ...state, videoMeta: meta, status: 'idle' as const })),
    on(AudioReplacerActions.loadMetaFailure, (state, { errorCode, message }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable: true })),
    on(AudioReplacerActions.setMode, (state, { mode }) => ({ ...state, mode })),
    on(AudioReplacerActions.setOriginalVolume, (state, { volume }) => ({ ...state, originalVolume: volume })),
    on(AudioReplacerActions.setNewAudioVolume, (state, { volume }) => ({ ...state, newAudioVolume: volume })),
    on(AudioReplacerActions.toggleLoopAudio, (state) => ({ ...state, loopAudio: !state.loopAudio })),
    on(AudioReplacerActions.setDurationConflict, (state, { conflict }) => ({ ...state, durationConflict: conflict })),
    on(AudioReplacerActions.startProcessing, (state) => ({ ...state, status: 'processing' as const, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
    on(AudioReplacerActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(AudioReplacerActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as const, outputBlob, outputSizeMB, progress: 100 })),
    on(AudioReplacerActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable })),
    on(AudioReplacerActions.resetState, () => initialState),
  ),
});

export const {
  selectAudioReplacerState, selectStatus, selectProgress, selectVideoFile, selectAudioFile, selectVideoMeta,
  selectMode, selectOriginalVolume, selectNewAudioVolume, selectLoopAudio, selectDurationConflict,
  selectOutputBlob, selectOutputSizeMB, selectErrorCode, selectErrorMessage, selectRetryable,
} = audioReplacerFeature;