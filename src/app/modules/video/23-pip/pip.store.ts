import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoMeta } from '../shared/types/video.types';
import { VideoErrorCode } from '../shared/errors/video.errors';
import { PipPosition } from './pip.service';

export interface PipState {
  mainFile: File | null;
  overlayFile: File | null;
  mainMeta: VideoMeta | null;
  overlayMeta: VideoMeta | null;
  pipWidthPercent: number;
  position: PipPosition;
  startTime: number | null;
  endTime: number | null;
  borderRadius: number;
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: PipState = {
  mainFile: null, overlayFile: null, mainMeta: null, overlayMeta: null,
  pipWidthPercent: 25, position: 'BR', startTime: null, endTime: null, borderRadius: 0,
  status: 'idle', progress: 0, outputBlob: null, outputSizeMB: null,
  errorCode: null, errorMessage: null, retryable: false,
};

export const PipActions = createActionGroup({
  source: 'Pip',
  events: {
    'Load Main File': props<{ file: File }>(),
    'Load Overlay File': props<{ file: File }>(),
    'Load Main Meta Success': props<{ meta: VideoMeta }>(),
    'Load Overlay Meta Success': props<{ meta: VideoMeta }>(),
    'Load Meta Failure': props<{ errorCode: VideoErrorCode; message: string }>(),
    'Set Pip Width Percent': props<{ percent: number }>(),
    'Set Position': props<{ position: PipPosition }>(),
    'Set Start Time': props<{ time: number | null }>(),
    'Set End Time': props<{ time: number | null }>(),
    'Set Border Radius': props<{ radius: number }>(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

export const pipFeature = createFeature({
  name: 'pip',
  reducer: createReducer(
    initialState,
    on(PipActions.loadMainFile, (state, { file }) => ({ ...state, mainFile: file })),
    on(PipActions.loadOverlayFile, (state, { file }) => ({ ...state, overlayFile: file })),
    on(PipActions.loadMainMetaSuccess, (state, { meta }) => ({ ...state, mainMeta: meta, status: 'idle' as const })),
    on(PipActions.loadOverlayMetaSuccess, (state, { meta }) => ({ ...state, overlayMeta: meta })),
    on(PipActions.loadMetaFailure, (state, { errorCode, message }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable: true })),
    on(PipActions.setPipWidthPercent, (state, { percent }) => ({ ...state, pipWidthPercent: percent })),
    on(PipActions.setPosition, (state, { position }) => ({ ...state, position })),
    on(PipActions.setStartTime, (state, { time }) => ({ ...state, startTime: time })),
    on(PipActions.setEndTime, (state, { time }) => ({ ...state, endTime: time })),
    on(PipActions.setBorderRadius, (state, { radius }) => ({ ...state, borderRadius: radius })),
    on(PipActions.startProcessing, (state) => ({ ...state, status: 'processing' as const, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
    on(PipActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(PipActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as const, outputBlob, outputSizeMB, progress: 100 })),
    on(PipActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable })),
    on(PipActions.resetState, () => initialState),
  ),
});

export const {
  selectPipState, selectStatus, selectProgress, selectMainFile, selectOverlayFile,
  selectMainMeta, selectOverlayMeta, selectPipWidthPercent, selectPosition,
  selectStartTime, selectEndTime, selectBorderRadius,
  selectOutputBlob, selectOutputSizeMB, selectErrorCode, selectErrorMessage, selectRetryable,
} = pipFeature;