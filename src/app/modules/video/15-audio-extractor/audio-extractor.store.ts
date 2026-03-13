import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoMeta } from '../shared/types/video.types';
import { VideoErrorCode } from '../shared/errors/video.errors';

export interface AudioExtractorState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  outputFormat: 'wav' | 'mp3' | 'aac' | 'ogg' | 'flac';
  bitrate: 128 | 192 | 256 | 320;
  waveformData: Float32Array | null;
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: AudioExtractorState = {
  inputFile: null,
  videoMeta: null,
  outputFormat: 'mp3',
  bitrate: 192,
  waveformData: null,
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false,
};

export const AudioExtractorActions = createActionGroup({
  source: 'AudioExtractor',
  events: {
    'Load File': props<{ file: File }>(),
    'Load Meta Success': props<{ meta: VideoMeta }>(),
    'Set Output Format': props<{ outputFormat: 'wav' | 'mp3' | 'aac' | 'ogg' | 'flac' }>(),
    'Set Bitrate': props<{ bitrate: 128 | 192 | 256 | 320 }>(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number; waveformData: Float32Array }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

export const audioExtractorFeature = createFeature({
  name: 'audioExtractor',
  reducer: createReducer(
    initialState,
    on(AudioExtractorActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'idle', progress: 0 })),
    on(AudioExtractorActions.loadMetaSuccess, (state, { meta }) => ({ ...state, videoMeta: meta })),
    on(AudioExtractorActions.setOutputFormat, (state, { outputFormat }) => ({ ...state, outputFormat })),
    on(AudioExtractorActions.setBitrate, (state, { bitrate }) => ({ ...state, bitrate })),
    on(AudioExtractorActions.startProcessing, (state) => ({ 
      ...state, 
      status: 'processing', 
      progress: 0, 
      outputBlob: null, 
      waveformData: null, 
      errorCode: null, 
      errorMessage: null 
    })),
    on(AudioExtractorActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(AudioExtractorActions.processingSuccess, (state, { outputBlob, outputSizeMB, waveformData }) => ({ 
      ...state, 
      status: 'success', 
      outputBlob, 
      outputSizeMB, 
      waveformData, 
      progress: 100 
    })),
    on(AudioExtractorActions.processingFailure, (state, { errorCode, message, retryable }) => ({ 
      ...state, 
      status: 'error', 
      errorCode, 
      errorMessage: message, 
      retryable 
    })),
    on(AudioExtractorActions.resetState, () => initialState),
  ),
});

export const {
  selectAudioExtractorState,
  selectStatus,
  selectProgress,
  selectInputFile,
  selectVideoMeta,
  selectOutputFormat,
  selectBitrate,
  selectWaveformData,
  selectOutputBlob,
  selectOutputSizeMB,
  selectErrorCode,
  selectErrorMessage,
  selectRetryable,
} = audioExtractorFeature;