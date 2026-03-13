import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoErrorCode } from '../shared/errors/video.errors';

export interface TransitionDef { type: string; duration: number; }

export interface TransitionsState {
  clips: File[];
  transitions: TransitionDef[];
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: TransitionsState = {
  clips: [], transitions: [],
  status: 'idle', progress: 0, outputBlob: null, outputSizeMB: null,
  errorCode: null, errorMessage: null, retryable: false,
};

export const TransitionsActions = createActionGroup({
  source: 'Transitions',
  events: {
    'Add Clip': props<{ file: File }>(),
    'Remove Clip': props<{ index: number }>(),
    'Reorder Clips': props<{ clips: File[] }>(),
    'Set Transition': props<{ index: number; transition: TransitionDef }>(),
    'Apply All Transitions': props<{ transition: TransitionDef }>(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

export const transitionsFeature = createFeature({
  name: 'transitions',
  reducer: createReducer(
    initialState,
    on(TransitionsActions.addClip, (state, { file }) => {
      const clips = [...state.clips, file];
      const transitions = [...state.transitions, { type: 'fade', duration: 0.5 }];
      // transitions = clips.length - 1 entries
      return { ...state, clips, transitions: transitions.slice(0, clips.length - 1) };
    }),
    on(TransitionsActions.removeClip, (state, { index }) => {
      const clips = state.clips.filter((_, i) => i !== index);
      const transitions = state.transitions.slice(0, Math.max(0, clips.length - 1));
      return { ...state, clips, transitions };
    }),
    on(TransitionsActions.reorderClips, (state, { clips }) => ({ ...state, clips })),
    on(TransitionsActions.setTransition, (state, { index, transition }) => ({
      ...state,
      transitions: state.transitions.map((t, i) => i === index ? transition : t),
    })),
    on(TransitionsActions.applyAllTransitions, (state, { transition }) => ({
      ...state,
      transitions: state.transitions.map(() => ({ ...transition })),
    })),
    on(TransitionsActions.startProcessing, (state) => ({ ...state, status: 'processing' as const, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
    on(TransitionsActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(TransitionsActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as const, outputBlob, outputSizeMB, progress: 100 })),
    on(TransitionsActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable })),
    on(TransitionsActions.resetState, () => initialState),
  ),
});

export const {
  selectTransitionsState, selectStatus, selectProgress, selectClips, selectTransitions,
  selectOutputBlob, selectOutputSizeMB, selectErrorCode, selectErrorMessage, selectRetryable,
} = transitionsFeature;