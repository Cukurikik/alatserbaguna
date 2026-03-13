import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';

export interface ConverterState {
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  inputFile: File | null;
  outputBlob: Blob | null;
  outputFormat: string;
  resolution: string;
  bitrate: number;
  crf: number;
  errorMessage: string | null;
}

const initialState: ConverterState = {
  status: 'idle', progress: 0, inputFile: null, outputBlob: null,
  outputFormat: 'mp4', resolution: 'original', bitrate: 0, crf: 23, errorMessage: null
};

export const ConverterActions = createActionGroup({
  source: 'Converter',
  events: {
    'Load File': props<{ file: File }>(),
    'Set Output Format': props<{ format: string }>(),
    'Set Resolution': props<{ resolution: string }>(),
    'Set CRF': props<{ crf: number }>(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob }>(),
    'Processing Failure': props<{ message: string }>(),
    'Download Output': emptyProps(),
    'Reset State': emptyProps(),
  }
});

export const converterFeature = createFeature({
  name: 'converter',
  reducer: createReducer(
    initialState,
    on(ConverterActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'idle' })),
    on(ConverterActions.setOutputFormat, (state, { format }) => ({ ...state, outputFormat: format })),
    on(ConverterActions.setResolution, (state, { resolution }) => ({ ...state, resolution })),
    on(ConverterActions.setCRF, (state, { crf }) => ({ ...state, crf })),
    on(ConverterActions.startProcessing, (state) => ({ ...state, status: 'processing', progress: 0, errorMessage: null })),
    on(ConverterActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(ConverterActions.processingSuccess, (state, { outputBlob }) => ({ ...state, status: 'success', outputBlob, progress: 100 })),
    on(ConverterActions.processingFailure, (state, { message }) => ({ ...state, status: 'error', errorMessage: message })),
    on(ConverterActions.resetState, () => initialState),
  )
});

export const { selectConverterState, selectStatus, selectProgress, selectInputFile, selectOutputBlob } = converterFeature;