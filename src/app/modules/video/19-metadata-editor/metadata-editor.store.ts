import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { VideoMeta, VideoErrorCode } from '../shared/types/video.types';

export interface MetadataFields {
  title: string; artist: string; album: string;
  year: string; description: string; comment: string; genre: string;
}

export interface MetadataEditorState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  editedFields: MetadataFields;
  stripAll: boolean;
  rawJson: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const emptyFields: MetadataFields = { title: '', artist: '', album: '', year: '', description: '', comment: '', genre: '' };

const initialState: MetadataEditorState = {
  inputFile: null, videoMeta: null, editedFields: emptyFields,
  stripAll: false, rawJson: '',
  status: 'idle', progress: 0, outputBlob: null, outputSizeMB: null,
  errorCode: null, errorMessage: null, retryable: false,
};

export const MetadataEditorActions = createActionGroup({
  source: 'MetadataEditor',
  events: {
    'Load File': props<{ file: File }>(),
    'Load Meta Success': props<{ meta: VideoMeta; rawJson: string }>(),
    'Load Meta Failure': props<{ errorCode: VideoErrorCode; message: string }>(),
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
    on(MetadataEditorActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'processing' as const })),
    on(MetadataEditorActions.loadMetaSuccess, (state, { meta, rawJson }) => ({ ...state, videoMeta: meta, rawJson, status: 'idle' as const })),
    on(MetadataEditorActions.loadMetaFailure, (state, { errorCode, message }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable: true })),
    on(MetadataEditorActions.updateField, (state, { key, value }) => ({ ...state, editedFields: { ...state.editedFields, [key]: value } })),
    on(MetadataEditorActions.toggleStripAll, (state) => ({ ...state, stripAll: !state.stripAll })),
    on(MetadataEditorActions.startProcessing, (state) => ({ ...state, status: 'processing' as const, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
    on(MetadataEditorActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(MetadataEditorActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as const, outputBlob, outputSizeMB, progress: 100 })),
    on(MetadataEditorActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as const, errorCode, errorMessage: message, retryable })),
    on(MetadataEditorActions.resetState, () => initialState),
  ),
});

export const {
  selectMetadataEditorState, selectStatus, selectProgress, selectInputFile, selectVideoMeta,
  selectEditedFields, selectStripAll, selectRawJson,
  selectOutputBlob, selectOutputSizeMB, selectErrorCode, selectErrorMessage, selectRetryable,
} = metadataEditorFeature;