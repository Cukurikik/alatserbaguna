import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoMeta } from '../shared/types/video.types';
import { VideoErrorCode } from '../shared/errors/video.errors';

export interface CropRegion { x: number; y: number; w: number; h: number; }

export interface CropResizeState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  mode: 'crop' | 'resize';
  cropRegion: CropRegion | null;
  targetWidth: number | null;
  targetHeight: number | null;
  lockAspectRatio: boolean;
  padMode: 'stretch' | 'pad' | 'crop-to-fit';
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: CropResizeState = {
  inputFile: null, videoMeta: null,
  mode: 'resize', cropRegion: null,
  targetWidth: 1920, targetHeight: 1080,
  lockAspectRatio: true, padMode: 'pad',
  status: 'idle', progress: 0, outputBlob: null, outputSizeMB: null,
  errorCode: null, errorMessage: null, retryable: false,
};

export const CropResizeActions = createActionGroup({
  source: 'CropResize',
  events: {
    'Load File': props<{ file: File }>(),
    'Load Meta Success': props<{ meta: VideoMeta }>(),
    'Load Meta Failure': props<{ errorCode: VideoErrorCode; message: string }>(),
    'Set Mode': props<{ mode: 'crop' | 'resize' }>(),
    'Set Crop Region': props<{ region: CropRegion }>(),
    'Set Target Width': props<{ width: number }>(),
    'Set Target Height': props<{ height: number }>(),
    'Toggle Lock Aspect': emptyProps(),
    'Set Pad Mode': props<{ padMode: 'stretch' | 'pad' | 'crop-to-fit' }>(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

export const cropResizeFeature = createFeature({
  name: 'cropResize',
  reducer: createReducer(
    initialState,
    on(CropResizeActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'processing' as const })),
    on(CropResizeActions.loadMetaSuccess, (state, { meta }) => ({ ...state, videoMeta: meta, status: 'idle' as const, targetWidth: meta.width, targetHeight: meta.height })),
    on(CropResizeActions.loadMetaFailure, (state, { errorCode, message }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable: true })),
    on(CropResizeActions.setMode, (state, { mode }) => ({ ...state, mode })),
    on(CropResizeActions.setCropRegion, (state, { region }) => ({ ...state, cropRegion: region })),
    on(CropResizeActions.setTargetWidth, (state, { width }) => ({ ...state, targetWidth: width })),
    on(CropResizeActions.setTargetHeight, (state, { height }) => ({ ...state, targetHeight: height })),
    on(CropResizeActions.toggleLockAspect, (state) => ({ ...state, lockAspectRatio: !state.lockAspectRatio })),
    on(CropResizeActions.setPadMode, (state, { padMode }) => ({ ...state, padMode })),
    on(CropResizeActions.startProcessing, (state) => ({ ...state, status: 'processing' as const, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
    on(CropResizeActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(CropResizeActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as const, outputBlob, outputSizeMB, progress: 100 })),
    on(CropResizeActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable })),
    on(CropResizeActions.resetState, () => initialState),
  ),
});

export const {
  selectCropResizeState, selectStatus, selectProgress, selectInputFile, selectVideoMeta,
  selectMode, selectCropRegion, selectTargetWidth, selectTargetHeight,
  selectLockAspectRatio, selectPadMode,
  selectOutputBlob, selectOutputSizeMB, selectErrorCode, selectErrorMessage, selectRetryable,
} = cropResizeFeature;