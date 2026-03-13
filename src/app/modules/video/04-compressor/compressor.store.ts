import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoErrorCode } from '../shared/errors/video.errors';
import { VideoMeta } from '../shared/types/video.types';

export interface CompressorState {
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  outputFormat: string;
  crf: number;
  preset: string;
  originalSizeMB: number;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: CompressorState = {
  status: 'idle',
  progress: 0,
  inputFile: null,
  videoMeta: null,
  outputBlob: null,
  outputSizeMB: null,
  outputFormat: 'mp4',
  crf: 28,
  preset: 'medium',
  originalSizeMB: 0,
  errorCode: null,
  errorMessage: null,
  retryable: false,
};

export const CompressorActions = createActionGroup({
  source: 'Compressor',
  events: {
    'Load File': props<{ file: File }>(),
    'Load Meta Success': props<{ meta: VideoMeta }>(),
    'Set CRF': props<{ crf: number }>(),
    'Set Preset': props<{ preset: string }>(),
    'Set Output Format': props<{ format: string }>(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Download Output': emptyProps(),
    'Reset State': emptyProps(),
  },
});

export const compressorFeature = createFeature({
  name: 'compressor',
  reducer: createReducer(
    initialState,
    on(CompressorActions.loadFile, (state, { file }) => ({ 
      ...state, 
      inputFile: file, 
      originalSizeMB: file.size / (1024 * 1024),
      status: 'idle' 
    })),
    on(CompressorActions.loadMetaSuccess, (state, { meta }) => ({ ...state, videoMeta: meta })),
    on(CompressorActions.setCRF, (state, { crf }) => ({ ...state, crf })),
    on(CompressorActions.setPreset, (state, { preset }) => ({ ...state, preset })),
    on(CompressorActions.setOutputFormat, (state, { format }) => ({ ...state, outputFormat: format })),
    on(CompressorActions.startProcessing, (state) => ({ 
      ...state, 
      status: 'processing', 
      progress: 0, 
      outputBlob: null, 
      errorCode: null, 
      errorMessage: null 
    })),
    on(CompressorActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(CompressorActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ 
      ...state, 
      status: 'success', 
      outputBlob, 
      outputSizeMB, 
      progress: 100 
    })),
    on(CompressorActions.processingFailure, (state, { errorCode, message, retryable }) => ({ 
      ...state, 
      status: 'error', 
      errorCode, 
      errorMessage: message, 
      retryable 
    })),
    on(CompressorActions.resetState, () => initialState),
  ),
});

export const {
  selectCompressorState,
  selectStatus,
  selectProgress,
  selectInputFile,
  selectVideoMeta,
  selectOutputBlob,
  selectOutputSizeMB,
  selectOutputFormat,
  selectCrf,
  selectPreset,
  selectOriginalSizeMB,
  selectErrorCode,
  selectErrorMessage,
  selectRetryable,
} = compressorFeature;