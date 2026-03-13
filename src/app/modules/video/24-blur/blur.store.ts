import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoMeta, VideoErrorCode } from '../shared/types/video.types';
import { BlurRegion } from './blur.service';

export interface BlurState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  mode: 'full' | 'region' | 'background';
  strength: number;
  region: BlurRegion | null;
  startTime: number | null;
  endTime: number | null;
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: BlurState = {
  inputFile: null, videoMeta: null,
  mode: 'full', strength: 10, region: null, startTime: null, endTime: null,
  status: 'idle', progress: 0, outputBlob: null, outputSizeMB: null,
  errorCode: null, errorMessage: null, retryable: false,
};

export const BlurActions = createActionGroup({
  source: 'Blur',
  events: {
    'Load File': props<{ file: File }>(),
    'Load Meta Success': props<{ meta: VideoMeta }>(),
    'Load Meta Failure': props<{ errorCode: VideoErrorCode; message: string }>(),
    'Set Mode': props<{ mode: 'full' | 'region' | 'background' }>(),
    'Set Strength': props<{ strength: number }>(),
    'Set Region': props<{ region: BlurRegion | null }>(),
    'Set Start Time': props<{ time: number | null }>(),
    'Set End Time': props<{ time: number | null }>(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

export const blurFeature = createFeature({
  name: 'blur',
  reducer: createReducer(
    initialState,
    on(BlurActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'processing' as const })),
    on(BlurActions.loadMetaSuccess, (state, { meta }) => ({ ...state, videoMeta: meta, status: 'idle' as const })),
    on(BlurActions.loadMetaFailure, (state, { errorCode, message }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable: true })),
    on(BlurActions.setMode, (state, { mode }) => ({ ...state, mode })),
    on(BlurActions.setStrength, (state, { strength }) => ({ ...state, strength })),
    on(BlurActions.setRegion, (state, { region }) => ({ ...state, region })),
    on(BlurActions.setStartTime, (state, { time }) => ({ ...state, startTime: time })),
    on(BlurActions.setEndTime, (state, { time }) => ({ ...state, endTime: time })),
    on(BlurActions.startProcessing, (state) => ({ ...state, status: 'processing' as const, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
    on(BlurActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(BlurActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as const, outputBlob, outputSizeMB, progress: 100 })),
    on(BlurActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable })),
    on(BlurActions.resetState, () => initialState),
  ),
});

export const {
  selectBlurState, selectStatus, selectProgress, selectInputFile, selectVideoMeta,
  selectMode, selectStrength, selectRegion, selectStartTime, selectEndTime,
  selectOutputBlob, selectOutputSizeMB, selectErrorCode, selectErrorMessage, selectRetryable,
} = blurFeature;