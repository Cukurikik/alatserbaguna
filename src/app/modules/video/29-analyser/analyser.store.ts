import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoMeta, VideoStream, AudioStream, SubtitleStream } from '../shared/types/video.types';
import { VideoErrorCode } from '../shared/errors/video.errors';

export interface AnalyserState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  videoStreams: VideoStream[];
  audioStreams: AudioStream[];
  subtitleStreams: SubtitleStream[];
  rawJson: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  outputBlob: null;
  outputSizeMB: null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: AnalyserState = {
  inputFile: null, videoMeta: null,
  videoStreams: [], audioStreams: [], subtitleStreams: [], rawJson: '',
  status: 'idle', progress: 0, outputBlob: null, outputSizeMB: null,
  errorCode: null, errorMessage: null, retryable: false,
};

export const AnalyserActions = createActionGroup({
  source: 'Analyser',
  events: {
    'Load File': props<{ file: File }>(),
    'Analysis Success': props<{ meta: VideoMeta; videoStreams: VideoStream[]; audioStreams: AudioStream[]; subtitleStreams: SubtitleStream[]; rawJson: string }>(),
    'Analysis Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

export const analyserFeature = createFeature({
  name: 'analyser',
  reducer: createReducer(
    initialState,
    on(AnalyserActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'processing' as const, progress: 50 })),
    on(AnalyserActions.analysisSuccess, (state, { meta, videoStreams, audioStreams, subtitleStreams, rawJson }) => ({
      ...state, videoMeta: meta, videoStreams, audioStreams, subtitleStreams, rawJson,
      status: 'done' as const, progress: 100,
    })),
    on(AnalyserActions.analysisFailure, (state, { errorCode, message, retryable }) => ({
      ...state, status: 'error' as const, errorCode, errorMessage: message, retryable,
    })),
    on(AnalyserActions.resetState, () => initialState),
  ),
});

export const {
  selectAnalyserState, selectStatus, selectProgress, selectInputFile, selectVideoMeta,
  selectVideoStreams, selectAudioStreams, selectSubtitleStreams, selectRawJson,
  selectOutputBlob, selectOutputSizeMB, selectErrorCode, selectErrorMessage, selectRetryable,
} = analyserFeature;