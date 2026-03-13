import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoMeta } from '../shared/types/video.types';
import { VideoErrorCode } from '../shared/errors/video.errors';

export interface ThumbnailGeneratorState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  mode: 'single' | 'grid' | 'interval';
  timestamp: number;
  gridCols: number;
  gridRows: number;
  intervalSeconds: number;
  imageFormat: 'jpg' | 'png' | 'webp';
  jpgQuality: number;
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  outputBlobs: Blob[];
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: ThumbnailGeneratorState = {
  inputFile: null,
  videoMeta: null,
  mode: 'single',
  timestamp: 0,
  gridCols: 4,
  gridRows: 4,
  intervalSeconds: 5,
  imageFormat: 'jpg',
  jpgQuality: 90,
  status: 'idle',
  progress: 0,
  outputBlobs: [],
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false,
};

export const ThumbnailGeneratorActions = createActionGroup({
  source: 'ThumbnailGenerator',
  events: {
    'Load File': props<{ file: File }>(),
    'Load Meta Success': props<{ meta: VideoMeta }>(),
    'Set Mode': props<{ mode: 'single' | 'grid' | 'interval' }>(),
    'Set Timestamp': props<{ timestamp: number }>(),
    'Set Grid Cols': props<{ cols: number }>(),
    'Set Grid Rows': props<{ rows: number }>(),
    'Set Interval': props<{ intervalSeconds: number }>(),
    'Set Image Format': props<{ imageFormat: 'jpg' | 'png' | 'webp' }>(),
    'Set Jpg Quality': props<{ quality: number }>(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlobs: Blob[]; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

export const thumbnailGeneratorFeature = createFeature({
  name: 'thumbnailGenerator',
  reducer: createReducer(
    initialState,
    on(ThumbnailGeneratorActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'idle', progress: 0 })),
    on(ThumbnailGeneratorActions.loadMetaSuccess, (state, { meta }) => ({ ...state, videoMeta: meta, timestamp: 0 })),
    on(ThumbnailGeneratorActions.setMode, (state, { mode }) => ({ ...state, mode })),
    on(ThumbnailGeneratorActions.setTimestamp, (state, { timestamp }) => ({ ...state, timestamp })),
    on(ThumbnailGeneratorActions.setGridCols, (state, { cols }) => ({ ...state, gridCols: cols })),
    on(ThumbnailGeneratorActions.setGridRows, (state, { rows }) => ({ ...state, gridRows: rows })),
    on(ThumbnailGeneratorActions.setInterval, (state, { intervalSeconds }) => ({ ...state, intervalSeconds })),
    on(ThumbnailGeneratorActions.setImageFormat, (state, { imageFormat }) => ({ ...state, imageFormat })),
    on(ThumbnailGeneratorActions.setJpgQuality, (state, { quality }) => ({ ...state, jpgQuality: quality })),
    on(ThumbnailGeneratorActions.startProcessing, (state) => ({ 
      ...state, 
      status: 'processing', 
      progress: 0, 
      outputBlobs: [], 
      errorCode: null, 
      errorMessage: null 
    })),
    on(ThumbnailGeneratorActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(ThumbnailGeneratorActions.processingSuccess, (state, { outputBlobs, outputSizeMB }) => ({ 
      ...state, 
      status: 'success', 
      outputBlobs, 
      outputSizeMB, 
      progress: 100 
    })),
    on(ThumbnailGeneratorActions.processingFailure, (state, { errorCode, message, retryable }) => ({ 
      ...state, 
      status: 'error', 
      errorCode, 
      errorMessage: message, 
      retryable 
    })),
    on(ThumbnailGeneratorActions.resetState, () => initialState),
  ),
});

export const {
  selectThumbnailGeneratorState,
  selectStatus,
  selectProgress,
  selectInputFile,
  selectVideoMeta,
  selectMode,
  selectTimestamp,
  selectGridCols,
  selectGridRows,
  selectIntervalSeconds,
  selectImageFormat,
  selectJpgQuality,
  selectOutputBlobs,
  selectOutputSizeMB,
  selectErrorCode,
  selectErrorMessage,
  selectRetryable,
} = thumbnailGeneratorFeature;