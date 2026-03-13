import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoErrorCode } from '../shared/types/video.types';

export interface SlideshowState {
  images: File[];
  defaultDuration: number;
  kenBurns: boolean;
  perImageDuration: number[];
  musicFile: File | null;
  musicVolume: number;
  loopMusic: boolean;
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: SlideshowState = {
  images: [], defaultDuration: 3, kenBurns: false,
  perImageDuration: [], musicFile: null, musicVolume: 0.5, loopMusic: true,
  status: 'idle', progress: 0, outputBlob: null, outputSizeMB: null,
  errorCode: null, errorMessage: null, retryable: false,
};

export const SlideshowActions = createActionGroup({
  source: 'Slideshow',
  events: {
    'Add Images': props<{ files: File[] }>(),
    'Remove Image': props<{ index: number }>(),
    'Reorder Images': props<{ images: File[] }>(),
    'Set Default Duration': props<{ duration: number }>(),
    'Set Per Image Duration': props<{ index: number; duration: number }>(),
    'Toggle Ken Burns': emptyProps(),
    'Set Music File': props<{ file: File | null }>(),
    'Set Music Volume': props<{ volume: number }>(),
    'Toggle Loop Music': emptyProps(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

export const slideshowFeature = createFeature({
  name: 'slideshow',
  reducer: createReducer(
    initialState,
    on(SlideshowActions.addImages, (state, { files }) => {
      const images = [...state.images, ...files];
      const perImageDuration = [...state.perImageDuration, ...files.map(() => state.defaultDuration)];
      return { ...state, images, perImageDuration };
    }),
    on(SlideshowActions.removeImage, (state, { index }) => ({
      ...state,
      images: state.images.filter((_, i) => i !== index),
      perImageDuration: state.perImageDuration.filter((_, i) => i !== index),
    })),
    on(SlideshowActions.reorderImages, (state, { images }) => ({ ...state, images })),
    on(SlideshowActions.setDefaultDuration, (state, { duration }) => ({ ...state, defaultDuration: duration })),
    on(SlideshowActions.setPerImageDuration, (state, { index, duration }) => ({
      ...state,
      perImageDuration: state.perImageDuration.map((d, i) => i === index ? duration : d),
    })),
    on(SlideshowActions.toggleKenBurns, (state) => ({ ...state, kenBurns: !state.kenBurns })),
    on(SlideshowActions.setMusicFile, (state, { file }) => ({ ...state, musicFile: file })),
    on(SlideshowActions.setMusicVolume, (state, { volume }) => ({ ...state, musicVolume: volume })),
    on(SlideshowActions.toggleLoopMusic, (state) => ({ ...state, loopMusic: !state.loopMusic })),
    on(SlideshowActions.startProcessing, (state) => ({ ...state, status: 'processing' as const, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
    on(SlideshowActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(SlideshowActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as const, outputBlob, outputSizeMB, progress: 100 })),
    on(SlideshowActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable })),
    on(SlideshowActions.resetState, () => initialState),
  ),
});

export const {
  selectSlideshowState, selectStatus, selectProgress, selectImages, selectDefaultDuration,
  selectPerImageDuration, selectKenBurns, selectMusicFile, selectMusicVolume, selectLoopMusic,
  selectOutputBlob, selectOutputSizeMB, selectErrorCode, selectErrorMessage, selectRetryable,
} = slideshowFeature;