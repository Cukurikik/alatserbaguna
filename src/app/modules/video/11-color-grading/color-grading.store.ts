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
  liftR: number; liftG: number; liftB: number;
  gainR: number; gainG: number; gainB: number;
  previewMode: 'original' | 'graded';
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: ColorGradingState = {
  inputFile: null, videoMeta: null,
  brightness: 0, contrast: 1, saturation: 1, hue: 0, gamma: 1,
  liftR: 0, liftG: 0, liftB: 0,
  gainR: 1, gainG: 1, gainB: 1,
  previewMode: 'graded',
  status: 'idle', progress: 0, outputBlob: null, outputSizeMB: null,
  errorCode: null, errorMessage: null, retryable: false,
};

export const ColorGradingActions = createActionGroup({
  source: 'ColorGrading',
  events: {
    'Load File': props<{ file: File }>(),
    'Load Meta Success': props<{ meta: VideoMeta }>(),
    'Load Meta Failure': props<{ errorCode: VideoErrorCode; message: string }>(),
    'Set Brightness': props<{ brightness: number }>(),
    'Set Contrast': props<{ contrast: number }>(),
    'Set Saturation': props<{ saturation: number }>(),
    'Set Hue': props<{ hue: number }>(),
    'Set Gamma': props<{ gamma: number }>(),
    'Set Lift': props<{ r: number; g: number; b: number }>(),
    'Set Gain': props<{ r: number; g: number; b: number }>(),
    'Set Preview Mode': props<{ mode: 'original' | 'graded' }>(),
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
    on(ColorGradingActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'processing' as const })),
    on(ColorGradingActions.loadMetaSuccess, (state, { meta }) => ({ ...state, videoMeta: meta, status: 'idle' as const })),
    on(ColorGradingActions.loadMetaFailure, (state, { errorCode, message }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable: true })),
    on(ColorGradingActions.setBrightness, (state, { brightness }) => ({ ...state, brightness })),
    on(ColorGradingActions.setContrast, (state, { contrast }) => ({ ...state, contrast })),
    on(ColorGradingActions.setSaturation, (state, { saturation }) => ({ ...state, saturation })),
    on(ColorGradingActions.setHue, (state, { hue }) => ({ ...state, hue })),
    on(ColorGradingActions.setGamma, (state, { gamma }) => ({ ...state, gamma })),
    on(ColorGradingActions.setLift, (state, { r, g, b }) => ({ ...state, liftR: r, liftG: g, liftB: b })),
    on(ColorGradingActions.setGain, (state, { r, g, b }) => ({ ...state, gainR: r, gainG: g, gainB: b })),
    on(ColorGradingActions.setPreviewMode, (state, { mode }) => ({ ...state, previewMode: mode })),
    on(ColorGradingActions.resetCorrection, (state) => ({
      ...state,
      brightness: 0, contrast: 1, saturation: 1, hue: 0, gamma: 1,
      liftR: 0, liftG: 0, liftB: 0, gainR: 1, gainG: 1, gainB: 1,
    })),
    on(ColorGradingActions.startProcessing, (state) => ({ ...state, status: 'processing' as const, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
    on(ColorGradingActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(ColorGradingActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as const, outputBlob, outputSizeMB, progress: 100 })),
    on(ColorGradingActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable })),
    on(ColorGradingActions.resetState, () => initialState),
  ),
});

export const {
  selectColorGradingState, selectStatus, selectProgress, selectInputFile, selectVideoMeta,
  selectBrightness, selectContrast, selectSaturation, selectHue, selectGamma,
  selectLiftR, selectLiftG, selectLiftB, selectGainR, selectGainG, selectGainB,
  selectPreviewMode, selectOutputBlob, selectOutputSizeMB,
  selectErrorCode, selectErrorMessage, selectRetryable,
} = colorGradingFeature;