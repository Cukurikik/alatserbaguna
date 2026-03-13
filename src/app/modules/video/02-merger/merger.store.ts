import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoErrorCode } from '../shared/errors/video.errors';

export interface MergerState {
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  inputFiles: File[];
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  outputFormat: string;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: MergerState = {
  status: 'idle',
  progress: 0,
  inputFiles: [],
  outputBlob: null,
  outputSizeMB: null,
  outputFormat: 'mp4',
  errorCode: null,
  errorMessage: null,
  retryable: false,
};

export const MergerActions = createActionGroup({
  source: 'Merger',
  events: {
    'Add Files': props<{ files: File[] }>(),
    'Remove File': props<{ index: number }>(),
    'Reorder Files': props<{ from: number; to: number }>(),
    'Set Output Format': props<{ format: string }>(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Download Output': emptyProps(),
    'Reset State': emptyProps(),
  },
});

export const mergerFeature = createFeature({
  name: 'merger',
  reducer: createReducer(
    initialState,
    on(MergerActions.addFiles, (state, { files }) => ({
      ...state,
      inputFiles: [...state.inputFiles, ...files],
      status: 'idle',
    })),
    on(MergerActions.removeFile, (state, { index }) => ({
      ...state,
      inputFiles: state.inputFiles.filter((_, i) => i !== index),
    })),
    on(MergerActions.reorderFiles, (state, { from, to }) => {
      const files = [...state.inputFiles];
      const [moved] = files.splice(from, 1);
      files.splice(to, 0, moved);
      return { ...state, inputFiles: files };
    }),
    on(MergerActions.setOutputFormat, (state, { format }) => ({ ...state, outputFormat: format })),
    on(MergerActions.startProcessing, (state) => ({ 
      ...state, 
      status: 'processing', 
      progress: 0, 
      errorCode: null, 
      errorMessage: null 
    })),
    on(MergerActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(MergerActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ 
      ...state, 
      status: 'success', 
      outputBlob, 
      outputSizeMB, 
      progress: 100 
    })),
    on(MergerActions.processingFailure, (state, { errorCode, message, retryable }) => ({ 
      ...state, 
      status: 'error', 
      errorCode, 
      errorMessage: message, 
      retryable 
    })),
    on(MergerActions.resetState, () => initialState),
  ),
});

export const {
  selectMergerState,
  selectStatus,
  selectProgress,
  selectInputFiles,
  selectOutputBlob,
  selectOutputSizeMB,
  selectOutputFormat,
  selectErrorCode,
  selectErrorMessage,
  selectRetryable,
} = mergerFeature;