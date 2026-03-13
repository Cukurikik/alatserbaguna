import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';

export interface CompressorState {
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  inputFile: File | null;
  outputBlob: Blob | null;
  outputFormat: string;
  crf: number;
  preset: string;
  originalSizeMB: number;
  outputSizeMB: number;
  errorMessage: string | null;
}

const initialState: CompressorState = {
  status: 'idle', progress: 0, inputFile: null, outputBlob: null,
  outputFormat: 'mp4', crf: 28, preset: 'medium', originalSizeMB: 0, outputSizeMB: 0, errorMessage: null
};

export const CompressorActions = createActionGroup({
  source: 'Compressor',
  events: {
    'Load File': props<{ file: File }>(),
    'Set CRF': props<{ crf: number }>(),
    'Set Preset': props<{ preset: string }>(),
    'Set Output Format': props<{ format: string }>(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ message: string }>(),
    'Download Output': emptyProps(),
    'Reset State': emptyProps(),
  }
});

export const compressorFeature = createFeature({
  name: 'compressor',
  reducer: createReducer(
    initialState,
    on(CompressorActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, originalSizeMB: file.size / 1024 / 1024, status: 'idle' })),
    on(CompressorActions.setCRF, (state, { crf }) => ({ ...state, crf })),
    on(CompressorActions.setPreset, (state, { preset }) => ({ ...state, preset })),
    on(CompressorActions.setOutputFormat, (state, { format }) => ({ ...state, outputFormat: format })),
    on(CompressorActions.startProcessing, (state) => ({ ...state, status: 'processing', progress: 0, errorMessage: null })),
    on(CompressorActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(CompressorActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'success', outputBlob, outputSizeMB, progress: 100 })),
    on(CompressorActions.processingFailure, (state, { message }) => ({ ...state, status: 'error', errorMessage: message })),
    on(CompressorActions.resetState, () => initialState),
  )
});

export const { selectCompressorState } = compressorFeature;