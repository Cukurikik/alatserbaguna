import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoMetadata } from '../shared/types/video.types';

export interface TrimmerState {
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  inputFile: File | null;
  outputBlob: Blob | null;
  startTime: number;
  endTime: number;
  outputFormat: string;
}

const initialState: TrimmerState = {
  status: 'idle',
  progress: 0,
  inputFile: null,
  outputBlob: null,
  startTime: 0,
  endTime: 0,
  outputFormat: 'mp4'
};

export const TrimmerActions = createActionGroup({
  source: 'Trimmer',
  events: {
    'Load File': props<{ file: File }>(),
    'Load Meta Success': props<{ meta: VideoMetadata }>(),
    'Load Meta Failure': props<{ errorCode: string }>(),
    'Set Start Time': props<{ time: number }>(),
    'Set End Time': props<{ time: number }>(),
    'Set Output Format': props<{ format: string }>(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob, outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: string, message: string }>(),
    'Download Output': emptyProps(),
    'Reset State': emptyProps()
  }
});

export const trimmerFeature = createFeature({
  name: 'trimmer',
  reducer: createReducer(
    initialState,
    on(TrimmerActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'processing', progress: 0 })),
    on(TrimmerActions.loadMetaSuccess, (state, { meta }) => ({ ...state, startTime: 0, endTime: meta.duration, status: 'idle' })),
    on(TrimmerActions.loadMetaFailure, (state) => ({ ...state, status: 'error' })),
    on(TrimmerActions.setStartTime, (state, { time }) => ({ ...state, startTime: time })),
    on(TrimmerActions.setEndTime, (state, { time }) => ({ ...state, endTime: time })),
    on(TrimmerActions.setOutputFormat, (state, { format }) => ({ ...state, outputFormat: format })),
    on(TrimmerActions.startProcessing, (state) => ({ ...state, status: 'processing', progress: 0 })),
    on(TrimmerActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(TrimmerActions.processingSuccess, (state, { outputBlob }) => ({ ...state, status: 'success', outputBlob, progress: 100 })),
    on(TrimmerActions.processingFailure, (state) => ({ ...state, status: 'error' })),
    on(TrimmerActions.resetState, () => initialState)
  )
});

export const { 
  selectTrimmerState, 
  selectStatus, 
  selectProgress, 
  selectInputFile, 
  selectOutputBlob, 
  selectStartTime, 
  selectEndTime, 
  selectOutputFormat 
} = trimmerFeature;