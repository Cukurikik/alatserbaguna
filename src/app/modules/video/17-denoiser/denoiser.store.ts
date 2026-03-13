import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoMeta, VideoErrorCode } from '../shared/types/video.types';

export type DenoiseAlgorithm = 'hqdn3d' | 'nlmeans' | 'atadenoise';

export interface DenoiserState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  algorithm: DenoiseAlgorithm;
  lumaStrength: number;
  chromaStrength: number;
  temporalStrength: number;
  denoiseAudio: boolean;
  audioNoiseLevel: number;
  estimatedSeconds: number;
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: DenoiserState = {
  inputFile: null, videoMeta: null,
  algorithm: 'hqdn3d', lumaStrength: 4, chromaStrength: 3, temporalStrength: 6,
  denoiseAudio: false, audioNoiseLevel: 12, estimatedSeconds: 0,
  status: 'idle', progress: 0, outputBlob: null, outputSizeMB: null,
  errorCode: null, errorMessage: null, retryable: false,
};

export const DenoiserActions = createActionGroup({
  source: 'Denoiser',
  events: {
    'Load File': props<{ file: File }>(),
    'Load Meta Success': props<{ meta: VideoMeta }>(),
    'Load Meta Failure': props<{ errorCode: VideoErrorCode; message: string }>(),
    'Set Algorithm': props<{ algorithm: DenoiseAlgorithm }>(),
    'Set Luma Strength': props<{ strength: number }>(),
    'Set Chroma Strength': props<{ strength: number }>(),
    'Set Temporal Strength': props<{ strength: number }>(),
    'Toggle Denoise Audio': emptyProps(),
    'Set Audio Noise Level': props<{ level: number }>(),
    'Set Estimated Seconds': props<{ seconds: number }>(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

export const denoiserFeature = createFeature({
  name: 'denoiser',
  reducer: createReducer(
    initialState,
    on(DenoiserActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'processing' as const })),
    on(DenoiserActions.loadMetaSuccess, (state, { meta }) => ({ ...state, videoMeta: meta, status: 'idle' as const })),
    on(DenoiserActions.loadMetaFailure, (state, { errorCode, message }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable: true })),
    on(DenoiserActions.setAlgorithm, (state, { algorithm }) => ({ ...state, algorithm })),
    on(DenoiserActions.setLumaStrength, (state, { strength }) => ({ ...state, lumaStrength: strength })),
    on(DenoiserActions.setChromaStrength, (state, { strength }) => ({ ...state, chromaStrength: strength })),
    on(DenoiserActions.setTemporalStrength, (state, { strength }) => ({ ...state, temporalStrength: strength })),
    on(DenoiserActions.toggleDenoiseAudio, (state) => ({ ...state, denoiseAudio: !state.denoiseAudio })),
    on(DenoiserActions.setAudioNoiseLevel, (state, { level }) => ({ ...state, audioNoiseLevel: level })),
    on(DenoiserActions.setEstimatedSeconds, (state, { seconds }) => ({ ...state, estimatedSeconds: seconds })),
    on(DenoiserActions.startProcessing, (state) => ({ ...state, status: 'processing' as const, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
    on(DenoiserActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(DenoiserActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as const, outputBlob, outputSizeMB, progress: 100 })),
    on(DenoiserActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable })),
    on(DenoiserActions.resetState, () => initialState),
  ),
});

export const {
  selectDenoiserState, selectStatus, selectProgress, selectInputFile, selectVideoMeta,
  selectAlgorithm, selectLumaStrength, selectChromaStrength, selectTemporalStrength,
  selectDenoiseAudio, selectAudioNoiseLevel, selectEstimatedSeconds,
  selectOutputBlob, selectOutputSizeMB, selectErrorCode, selectErrorMessage, selectRetryable,
} = denoiserFeature;