import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoMeta } from '../shared/types/video.types';
import { VideoErrorCode } from '../shared/errors/video.errors';

export interface VideoToGifState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  startTime: number;
  endTime: number;
  fps: number;
  width: number | 'auto';
  dither: 'none' | 'bayer' | 'floyd_steinberg';
  estimatedSizeMB: number;
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: VideoToGifState = {
  inputFile: null, videoMeta: null,
  startTime: 0, endTime: 5, fps: 15, width: 480, dither: 'bayer', estimatedSizeMB: 0,
  status: 'idle', progress: 0, outputBlob: null, outputSizeMB: null,
  errorCode: null, errorMessage: null, retryable: false,
};

export const VideoToGifActions = createActionGroup({
  source: 'VideoToGif',
  events: {
    'Load File': props<{ file: File }>(),
    'Load Meta Success': props<{ meta: VideoMeta }>(),
    'Load Meta Failure': props<{ errorCode: VideoErrorCode; message: string }>(),
    'Set Start Time': props<{ time: number }>(),
    'Set End Time': props<{ time: number }>(),
    'Set FPS': props<{ fps: number }>(),
    'Set Width': props<{ width: number | 'auto' }>(),
    'Set Dither': props<{ dither: 'none' | 'bayer' | 'floyd_steinberg' }>(),
    'Set Estimated Size': props<{ sizeMB: number }>(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

export const videoToGifFeature = createFeature({
  name: 'videoToGif',
  reducer: createReducer(
    initialState,
    on(VideoToGifActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'processing' as const })),
    on(VideoToGifActions.loadMetaSuccess, (state, { meta }) => ({ ...state, videoMeta: meta, status: 'idle' as const, startTime: 0, endTime: Math.min(5, meta.duration) })),
    on(VideoToGifActions.loadMetaFailure, (state, { errorCode, message }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable: true })),
    on(VideoToGifActions.setStartTime, (state, { time }) => ({ ...state, startTime: time })),
    on(VideoToGifActions.setEndTime, (state, { time }) => ({ ...state, endTime: time })),
    on(VideoToGifActions.setFPS, (state, { fps }) => ({ ...state, fps })),
    on(VideoToGifActions.setWidth, (state, { width }) => ({ ...state, width })),
    on(VideoToGifActions.setDither, (state, { dither }) => ({ ...state, dither })),
    on(VideoToGifActions.setEstimatedSize, (state, { sizeMB }) => ({ ...state, estimatedSizeMB: sizeMB })),
    on(VideoToGifActions.startProcessing, (state) => ({ ...state, status: 'processing' as const, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
    on(VideoToGifActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(VideoToGifActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as const, outputBlob, outputSizeMB, progress: 100 })),
    on(VideoToGifActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable })),
    on(VideoToGifActions.resetState, () => initialState),
  ),
});

export const {
  selectVideoToGifState, selectStatus, selectProgress, selectInputFile, selectVideoMeta,
  selectStartTime, selectEndTime, selectFPS, selectWidth, selectDither, selectEstimatedSizeMB,
  selectOutputBlob, selectOutputSizeMB, selectErrorCode, selectErrorMessage, selectRetryable,
} = videoToGifFeature;