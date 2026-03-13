import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoErrorCode } from '../shared/errors/video.errors';
import { VideoMeta } from '../shared/types/video.types';

export interface ConverterState {
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  outputFormat: string;
  resolution: string;
  crf: number;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: ConverterState = {
  status: 'idle',
  progress: 0,
  inputFile: null,
  videoMeta: null,
  outputBlob: null,
  outputSizeMB: null,
  outputFormat: 'mp4',
  resolution: 'original',
  crf: 23,
  errorCode: null,
  errorMessage: null,
  retryable: false,
};

export const ConverterActions = createActionGroup({
  source: 'Converter',
  events: {
    'Load File': props<{ file: File }>(),
    'Load Meta Success': props<{ meta: VideoMeta }>(),
    'Set Output Format': props<{ format: string }>(),
    'Set Resolution': props<{ resolution: string }>(),
    'Set CRF': props<{ crf: number }>(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Download Output': emptyProps(),
    'Reset State': emptyProps(),
  },
});

export const converterFeature = createFeature({
  name: 'converter',
  reducer: createReducer(
    initialState,
    on(ConverterActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'idle', errorCode: null, errorMessage: null })),
    on(ConverterActions.loadMetaSuccess, (state, { meta }) => ({ ...state, videoMeta: meta })),
    on(ConverterActions.setOutputFormat, (state, { format }) => ({ ...state, outputFormat: format })),
    on(ConverterActions.setResolution, (state, { resolution }) => ({ ...state, resolution })),
    on(ConverterActions.setCRF, (state, { crf }) => ({ ...state, crf })),
    on(ConverterActions.startProcessing, (state) => ({ 
      ...state, 
      status: 'processing', 
      progress: 0, 
      outputBlob: null, 
      errorCode: null, 
      errorMessage: null 
    })),
    on(ConverterActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(ConverterActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ 
      ...state, 
      status: 'success', 
      outputBlob, 
      outputSizeMB, 
      progress: 100 
    })),
    on(ConverterActions.processingFailure, (state, { errorCode, message, retryable }) => ({ 
      ...state, 
      status: 'error', 
      errorCode, 
      errorMessage: message, 
      retryable 
    })),
    on(ConverterActions.resetState, () => initialState),
  ),
});

export const {
  selectConverterState,
  selectStatus,
  selectProgress,
  selectInputFile,
  selectVideoMeta,
  selectOutputBlob,
  selectOutputSizeMB,
  selectOutputFormat,
  selectResolution,
  selectCrf,
  selectErrorCode,
  selectErrorMessage,
  selectRetryable,
} = converterFeature;