import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, concatMap, exhaustMap, map, of, tap } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ProcessingStatus, AudioErrorCode, ExportFormat } from '../shared/types/audio.types';
import { MergerService } from './merger.service';

export interface MergerState {
  inputFiles: File[];
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
  logs: string[];
}

const initialState: MergerState = {
  inputFiles: [],
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: true,
  logs: []
};

export const MergerActions = createActionGroup({
  source: '[Merger]',
  events: {
    'Add Files': props<{ files: File[] }>(),
    'Remove File': props<{ index: number }>(),
    'Reorder Files': props<{ previousIndex: number, currentIndex: number }>(),
    'Start Processing': props<{ format: ExportFormat, crossfadeMs: number, gapMs: number }>(),
    'Update Progress': props<{ value: number }>(),
    'Worker Log': props<{ message: string }>(),
    'Processing Success': props<{ outputBlob: Blob, sizeMB: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Reset State': emptyProps(),
  }
});

export const mergerReducer = createReducer(
  initialState,
  on(MergerActions.addFiles, (s, { files }) => ({ ...s, inputFiles: [...s.inputFiles, ...files], status: 'idle' as ProcessingStatus, errorMessage: null, errorCode: null })),
  on(MergerActions.removeFile, (s, { index }) => {
    const arr = [...s.inputFiles];
    arr.splice(index, 1);
    return { ...s, inputFiles: arr };
  }),
  on(MergerActions.reorderFiles, (s, { previousIndex, currentIndex }) => {
    const arr = [...s.inputFiles];
    const prev = arr.splice(previousIndex, 1)[0];
    arr.splice(currentIndex, 0, prev);
    return { ...s, inputFiles: arr };
  }),
  on(MergerActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorMessage: null, logs: [] })),
  on(MergerActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(MergerActions.workerLog, (s, { message }) => ({ ...s, logs: [...s.logs, message] })),
  on(MergerActions.processingSuccess, (s, { outputBlob, sizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB: sizeMB })),
  on(MergerActions.processingFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(MergerActions.resetState, () => ({ ...initialState }))
);

export const selectMergerState = createFeatureSelector<MergerState>('merger');
export const selectMergerStatus = createSelector(selectMergerState, s => s.status);
export const selectMergerFiles = createSelector(selectMergerState, s => s.inputFiles);

export const processMergerEffect = createEffect(
  (actions$ = inject(Actions), mergerService = inject(MergerService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(MergerActions.startProcessing),
      withLatestFrom(store.select(selectMergerState)),
      exhaustMap(([{ format, crossfadeMs, gapMs }, state]) => {
        if (state.inputFiles.length < 2) return of(MergerActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'At least 2 files are needed to merge.' }));
        
        return mergerService.mergeAudio(state.inputFiles, format, crossfadeMs, gapMs).pipe(
          map(event => {
            if (event.type === 'progress') {
              return MergerActions.updateProgress({ value: event.value || 0 });
            } else if (event.type === 'complete' && event.data) {
              return MergerActions.processingSuccess({ outputBlob: event.data.blob, sizeMB: event.data.sizeMB });
            } else if (event.type === 'log' && event.message) {
              return MergerActions.workerLog({ message: event.message });
            }
            return MergerActions.updateProgress({ value: 0 }); 
          }),
          catchError(err => of(MergerActions.processingFailure({ 
            errorCode: err.errorCode || 'ENCODE_FAILED', 
            message: err.message || 'Unknown processing error' 
          })))
        );
      })
    );
  },
  { functional: true }
);

export const mergerProcessingEffect = processMergerEffect;
