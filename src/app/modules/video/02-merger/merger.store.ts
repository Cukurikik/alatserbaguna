import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';

export interface MergerState {
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  inputFiles: File[];
  outputBlob: Blob | null;
  outputFormat: string;
  errorMessage: string | null;
}

const initialState: MergerState = {
  status: 'idle',
  progress: 0,
  inputFiles: [],
  outputBlob: null,
  outputFormat: 'mp4',
  errorMessage: null,
};

export const MergerActions = createActionGroup({
  source: 'Merger',
  events: {
    'Add Files': props<{ files: File[] }>(),
    'Remove File': props<{ index: number }>(),
    'Reorder Files': props<{ from: number; to: number }>(),
    'Set Output Format': props<{ format: string }>(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ progress: number }>(),
    'Processing Success': props<{ outputBlob: Blob }>(),
    'Processing Failure': props<{ message: string }>(),
    'Download Output': emptyProps(),
    'Reset State': emptyProps(),
  }
});

export const mergerFeature = createFeature({
  name: 'merger',
  reducer: createReducer(
    initialState,
    on(MergerActions.addFiles, (state, { files }) => ({
      ...state,
      inputFiles: [...state.inputFiles, ...files],
      status: 'idle'
    })),
    on(MergerActions.removeFile, (state, { index }) => ({
      ...state,
      inputFiles: state.inputFiles.filter((_, i) => i !== index)
    })),
    on(MergerActions.reorderFiles, (state, { from, to }) => {
      const files = [...state.inputFiles];
      const [moved] = files.splice(from, 1);
      files.splice(to, 0, moved);
      return { ...state, inputFiles: files };
    }),
    on(MergerActions.setOutputFormat, (state, { format }) => ({ ...state, outputFormat: format })),
    on(MergerActions.startProcessing, (state) => ({ ...state, status: 'processing', progress: 0, errorMessage: null })),
    on(MergerActions.updateProgress, (state, { progress }) => ({ ...state, progress })),
    on(MergerActions.processingSuccess, (state, { outputBlob }) => ({ ...state, status: 'success', outputBlob, progress: 100 })),
    on(MergerActions.processingFailure, (state, { message }) => ({ ...state, status: 'error', errorMessage: message })),
    on(MergerActions.resetState, () => initialState),
  )
});

export const { selectMergerState, selectStatus, selectProgress, selectInputFiles, selectOutputBlob, selectOutputFormat } = mergerFeature;