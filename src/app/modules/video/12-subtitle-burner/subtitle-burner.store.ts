import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoMeta } from '../shared/types/video.types';
import { VideoErrorCode } from '../shared/errors/video.errors';

export interface SubtitleBurnerState {
  videoFile: File | null;
  videoMeta: VideoMeta | null;
  subtitleContent: string;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  outlineColor: string;
  position: 'top' | 'bottom';
  offsetSeconds: number;
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: SubtitleBurnerState = {
  videoFile: null, videoMeta: null,
  subtitleContent: '', fontFamily: 'Arial', fontSize: 24,
  fontColor: '#FFFFFF', outlineColor: '#000000',
  position: 'bottom', offsetSeconds: 0,
  status: 'idle', progress: 0, outputBlob: null, outputSizeMB: null,
  errorCode: null, errorMessage: null, retryable: false,
};

export const SubtitleBurnerActions = createActionGroup({
  source: 'SubtitleBurner',
  events: {
    'Load Video': props<{ file: File }>(),
    'Load Meta Success': props<{ meta: VideoMeta }>(),
    'Load Meta Failure': props<{ errorCode: VideoErrorCode; message: string }>(),
    'Set Subtitle Content': props<{ content: string }>(),
    'Set Font Family': props<{ fontFamily: string }>(),
    'Set Font Size': props<{ fontSize: number }>(),
    'Set Font Color': props<{ color: string }>(),
    'Set Outline Color': props<{ color: string }>(),
    'Set Position': props<{ position: 'top' | 'bottom' }>(),
    'Set Offset': props<{ offsetSeconds: number }>(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

export const subtitleBurnerFeature = createFeature({
  name: 'subtitleBurner',
  reducer: createReducer(
    initialState,
    on(SubtitleBurnerActions.loadVideo, (state, { file }) => ({ ...state, videoFile: file, status: 'processing' as const })),
    on(SubtitleBurnerActions.loadMetaSuccess, (state, { meta }) => ({ ...state, videoMeta: meta, status: 'idle' as const })),
    on(SubtitleBurnerActions.loadMetaFailure, (state, { errorCode, message }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable: true })),
    on(SubtitleBurnerActions.setSubtitleContent, (state, { content }) => ({ ...state, subtitleContent: content })),
    on(SubtitleBurnerActions.setFontFamily, (state, { fontFamily }) => ({ ...state, fontFamily })),
    on(SubtitleBurnerActions.setFontSize, (state, { fontSize }) => ({ ...state, fontSize })),
    on(SubtitleBurnerActions.setFontColor, (state, { color }) => ({ ...state, fontColor: color })),
    on(SubtitleBurnerActions.setOutlineColor, (state, { color }) => ({ ...state, outlineColor: color })),
    on(SubtitleBurnerActions.setPosition, (state, { position }) => ({ ...state, position })),
    on(SubtitleBurnerActions.setOffset, (state, { offsetSeconds }) => ({ ...state, offsetSeconds })),
    on(SubtitleBurnerActions.startProcessing, (state) => ({ ...state, status: 'processing' as const, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
    on(SubtitleBurnerActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(SubtitleBurnerActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as const, outputBlob, outputSizeMB, progress: 100 })),
    on(SubtitleBurnerActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable })),
    on(SubtitleBurnerActions.resetState, () => initialState),
  ),
});

export const {
  selectSubtitleBurnerState, selectStatus, selectProgress, selectVideoFile, selectVideoMeta,
  selectSubtitleContent, selectFontFamily, selectFontSize, selectFontColor,
  selectOutlineColor, selectPosition, selectOffsetSeconds,
  selectOutputBlob, selectOutputSizeMB, selectErrorCode, selectErrorMessage, selectRetryable,
} = subtitleBurnerFeature;