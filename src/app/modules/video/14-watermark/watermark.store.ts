import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoMeta } from '../shared/types/video.types';
import { VideoErrorCode } from '../shared/errors/video.errors';

export interface WatermarkState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  mode: 'text' | 'image';
  text: string;
  textSize: number;
  textColor: string;
  opacity: number;
  positionPreset: 'TL' | 'TC' | 'TR' | 'ML' | 'MC' | 'MR' | 'BL' | 'BC' | 'BR';
  offsetX: number;
  offsetY: number;
  imageFile: File | null;
  imageWidth: number;
  tiled: boolean;
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: WatermarkState = {
  inputFile: null, videoMeta: null, mode: 'text',
  text: 'Omni-Tool', textSize: 36, textColor: '#FFFFFF', opacity: 0.7,
  positionPreset: 'BR', offsetX: 10, offsetY: 10,
  imageFile: null, imageWidth: 200, tiled: false,
  status: 'idle', progress: 0, outputBlob: null, outputSizeMB: null,
  errorCode: null, errorMessage: null, retryable: false,
};

export const WatermarkActions = createActionGroup({
  source: 'Watermark',
  events: {
    'Load File': props<{ file: File }>(),
    'Load Meta Success': props<{ meta: VideoMeta }>(),
    'Load Meta Failure': props<{ errorCode: VideoErrorCode; message: string }>(),
    'Set Mode': props<{ mode: 'text' | 'image' }>(),
    'Set Text': props<{ text: string }>(),
    'Set Text Size': props<{ size: number }>(),
    'Set Text Color': props<{ color: string }>(),
    'Set Opacity': props<{ opacity: number }>(),
    'Set Position Preset': props<{ preset: 'TL' | 'TC' | 'TR' | 'ML' | 'MC' | 'MR' | 'BL' | 'BC' | 'BR' }>(),
    'Set Offset': props<{ x: number; y: number }>(),
    'Load Image File': props<{ file: File }>(),
    'Set Image Width': props<{ width: number }>(),
    'Toggle Tiled': emptyProps(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

export const watermarkFeature = createFeature({
  name: 'watermark',
  reducer: createReducer(
    initialState,
    on(WatermarkActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'processing' as const })),
    on(WatermarkActions.loadMetaSuccess, (state, { meta }) => ({ ...state, videoMeta: meta, status: 'idle' as const })),
    on(WatermarkActions.loadMetaFailure, (state, { errorCode, message }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable: true })),
    on(WatermarkActions.setMode, (state, { mode }) => ({ ...state, mode })),
    on(WatermarkActions.setText, (state, { text }) => ({ ...state, text })),
    on(WatermarkActions.setTextSize, (state, { size }) => ({ ...state, textSize: size })),
    on(WatermarkActions.setTextColor, (state, { color }) => ({ ...state, textColor: color })),
    on(WatermarkActions.setOpacity, (state, { opacity }) => ({ ...state, opacity })),
    on(WatermarkActions.setPositionPreset, (state, { preset }) => ({ ...state, positionPreset: preset })),
    on(WatermarkActions.setOffset, (state, { x, y }) => ({ ...state, offsetX: x, offsetY: y })),
    on(WatermarkActions.loadImageFile, (state, { file }) => ({ ...state, imageFile: file })),
    on(WatermarkActions.setImageWidth, (state, { width }) => ({ ...state, imageWidth: width })),
    on(WatermarkActions.toggleTiled, (state) => ({ ...state, tiled: !state.tiled })),
    on(WatermarkActions.startProcessing, (state) => ({ ...state, status: 'processing' as const, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
    on(WatermarkActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(WatermarkActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as const, outputBlob, outputSizeMB, progress: 100 })),
    on(WatermarkActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable })),
    on(WatermarkActions.resetState, () => initialState),
  ),
});

export const {
  selectWatermarkState, selectStatus, selectProgress, selectInputFile, selectVideoMeta,
  selectMode, selectText, selectTextSize, selectTextColor, selectOpacity,
  selectPositionPreset, selectOffsetX, selectOffsetY,
  selectImageFile, selectImageWidth, selectTiled,
  selectOutputBlob, selectOutputSizeMB, selectErrorCode, selectErrorMessage, selectRetryable,
} = watermarkFeature;