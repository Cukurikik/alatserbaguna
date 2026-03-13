import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoMeta, VideoErrorCode } from '../shared/types/video.types';

export interface SplitSegment { start: number; end: number; }

export interface SplitterState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  mode: 'markers' | 'equal';
  markers: number[];
  equalParts: number;
  segments: SplitSegment[];
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  outputBlobs: Blob[];
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: SplitterState = {
  inputFile: null, videoMeta: null,
  mode: 'markers', markers: [], equalParts: 3, segments: [],
  status: 'idle', progress: 0, outputBlobs: [], outputSizeMB: null,
  errorCode: null, errorMessage: null, retryable: false,
};

export const SplitterActions = createActionGroup({
  source: 'Splitter',
  events: {
    'Load File': props<{ file: File }>(),
    'Load Meta Success': props<{ meta: VideoMeta }>(),
    'Load Meta Failure': props<{ errorCode: VideoErrorCode; message: string }>(),
    'Set Mode': props<{ mode: 'markers' | 'equal' }>(),
    'Add Marker': props<{ time: number }>(),
    'Remove Marker': props<{ time: number }>(),
    'Set Equal Parts': props<{ parts: number }>(),
    'Set Segments': props<{ segments: SplitSegment[] }>(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlobs: Blob[]; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

export const splitterFeature = createFeature({
  name: 'splitter',
  reducer: createReducer(
    initialState,
    on(SplitterActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'processing' as const })),
    on(SplitterActions.loadMetaSuccess, (state, { meta }) => ({ ...state, videoMeta: meta, status: 'idle' as const })),
    on(SplitterActions.loadMetaFailure, (state, { errorCode, message }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable: true })),
    on(SplitterActions.setMode, (state, { mode }) => ({ ...state, mode })),
    on(SplitterActions.addMarker, (state, { time }) => ({ ...state, markers: [...state.markers, time].sort((a, b) => a - b) })),
    on(SplitterActions.removeMarker, (state, { time }) => ({ ...state, markers: state.markers.filter(m => m !== time) })),
    on(SplitterActions.setEqualParts, (state, { parts }) => ({ ...state, equalParts: parts })),
    on(SplitterActions.setSegments, (state, { segments }) => ({ ...state, segments })),
    on(SplitterActions.startProcessing, (state) => ({ ...state, status: 'processing' as const, progress: 0, outputBlobs: [], errorCode: null, errorMessage: null })),
    on(SplitterActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(SplitterActions.processingSuccess, (state, { outputBlobs, outputSizeMB }) => ({ ...state, status: 'done' as const, outputBlobs, outputSizeMB, progress: 100 })),
    on(SplitterActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable })),
    on(SplitterActions.resetState, () => initialState),
  ),
});

export const {
  selectSplitterState, selectStatus, selectProgress, selectInputFile, selectVideoMeta,
  selectMode, selectMarkers, selectEqualParts, selectSegments,
  selectOutputBlobs, selectOutputSizeMB, selectErrorCode, selectErrorMessage, selectRetryable,
} = splitterFeature;