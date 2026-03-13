import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoMeta } from '../shared/types/video.types';
import { VideoErrorCode } from '../shared/errors/video.errors';

export interface MetadataFields {
  title: string;
  artist: string;
  album: string;
  year: string;
  description: string;
  comment: string;
  genre: string;
}

export interface MetadataEditorState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  editedFields: MetadataFields;
  stripAll: boolean;
  rawJson: string;
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const emptyFields: MetadataFields = { 
  title: '', artist: '', album: '', year: '', 
  description: '', comment: '', genre: '' 
};

const initialState: MetadataEditorState = {
  inputFile: null,
  videoMeta: null,
  editedFields: emptyFields,
  stripAll: false,
  rawJson: '',
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false,
};

export const MetadataEditorActions = createActionGroup({
  source: 'MetadataEditor',
  events: {
    'Load File': props<{ file: File }>(),
    'Load Meta Success': props<{ meta: VideoMeta; rawJson: string }>(),
    'Update Field': props<{ key: keyof MetadataFields; value: string }>(),
    'Toggle Strip All': emptyProps(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: VideoErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

export const metadataEditorFeature = createFeature({
  name: 'metadataEditor',
  reducer: createReducer(
    initialState,
    on(MetadataEditorActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'idle', progress: 0 })),
    on(MetadataEditorActions.loadMetaSuccess, (state, { meta, rawJson }) => ({ ...state, videoMeta: meta, rawJson })),
    on(MetadataEditorActions.updateField, (state, { key, value }) => ({ 
      ...state, 
      editedFields: { ...state.editedFields, [key]: value } 
    })),
    on(MetadataEditorActions.toggleStripAll, (state) => ({ ...state, stripAll: !state.stripAll })),
    on(MetadataEditorActions.startProcessing, (state) => ({ 
      ...state, 
      status: 'processing', 
      progress: 0, 
      outputBlob: null, 
      errorCode: null, 
      errorMessage: null 
    })),
    on(MetadataEditorActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(MetadataEditorActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ 
      ...state, 
      status: 'success', 
      outputBlob, 
      outputSizeMB, 
      progress: 100 
    })),
    on(MetadataEditorActions.processingFailure, (state, { errorCode, message, retryable }) => ({ 
      ...state, 
      status: 'error', 
      errorCode, 
      errorMessage: message, 
      retryable 
    })),
    on(MetadataEditorActions.resetState, () => initialState),
  ),
});

export const {
  selectMetadataEditorState,
  selectStatus,
  selectProgress,
  selectInputFile,
  selectVideoMeta,
  selectEditedFields,
  selectStripAll,
  selectRawJson,
  selectOutputBlob,
  selectOutputSizeMB,
  selectErrorCode,
  selectErrorMessage,
  selectRetryable,
} = metadataEditorFeature;