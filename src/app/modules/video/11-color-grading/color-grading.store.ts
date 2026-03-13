import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoMeta } from '../shared/types/video.types';
import { VideoErrorCode } from '../shared/errors/video.errors';

export interface ColorGradingState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  gamma: number;
  sharpness: number;
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: ColorGradingState = {
  inputFile: null,
  videoMeta: null,
  brightness: 0,
  contrast: 1,
  saturation: 1,
  hue: 0,
  gamma: 1,
  sharpness: 0,
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false,
};

export const ColorGradingActions = createActionGroup({
  source: 'ColorGrading',
  events: {
    'Load File': props<{ file: File }>(),
    'Load Meta Success': props<{ meta: VideoMeta }>(),
    'Set Brightness': props<{ brightness: number }>(),
    'Set Contrast': props<{ contrast: number }>(),
    'Set Saturation': props<{ saturation: number }>(),
    'Set Hue': props<{ hue: number }>(),
    'Set Gamma': props<{ gamma: number }>(),
    'Set Sharpness': props<{ sharpness: number }>(),
    'Reset Correction': emptyProps(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

export const colorGradingFeature = createFeature({
  name: 'colorGrading',
  reducer: createReducer(
    initialState,
    on(ColorGradingActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'idle', progress: 0 })),
    on(ColorGradingActions.loadMetaSuccess, (state, { meta }) => ({ ...state, videoMeta: meta })),
    on(ColorGradingActions.setBrightness, (state, { brightness }) => ({ ...state, brightness })),
    on(ColorGradingActions.setContrast, (state, { contrast }) => ({ ...state, contrast })),
    on(ColorGradingActions.setSaturation, (state, { saturation }) => ({ ...state, saturation })),
    on(ColorGradingActions.setHue, (state, { hue }) => ({ ...state, hue })),
    on(ColorGradingActions.setGamma, (state, { gamma }) => ({ ...state, gamma })),
    on(ColorGradingActions.setSharpness, (state, { sharpness }) => ({ ...state, sharpness })),
    on(ColorGradingActions.resetCorrection, (state) => ({
      ...state,
      brightness: 0, contrast: 1, saturation: 1, hue: 0, gamma: 1, sharpness: 0
    })),
    on(ColorGradingActions.startProcessing, (state) => ({ 
      ...state, 
      status: 'processing', 
      progress: 0, 
      outputBlob: null, 
      errorCode: null, 
      errorMessage: null 
    })),
    on(ColorGradingActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(ColorGradingActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ 
      ...state, 
      status: 'success', 
      outputBlob, 
      outputSizeMB, 
      progress: 100 
    })),
    on(ColorGradingActions.processingFailure, (state, { errorCode, message, retryable }) => ({ 
      ...state, 
      status: 'error', 
      errorCode, 
      errorMessage: message, 
      retryable 
    })),
    on(ColorGradingActions.resetState, () => initialState),
  ),
});

export const {
  selectColorGradingState,
  selectStatus,
  selectProgress,
  selectInputFile,
  selectVideoMeta,
  selectBrightness,
  selectContrast,
  selectSaturation,
  selectHue,
  selectGamma,
  selectSharpness,
  selectOutputBlob,
  selectOutputSizeMB,
  selectErrorCode,
  selectErrorMessage,
  selectRetryable,
} = colorGradingFeature;