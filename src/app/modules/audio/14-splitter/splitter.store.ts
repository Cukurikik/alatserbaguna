import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ProcessingStatus, AudioErrorCode, ExportFormat } from '../shared/types/audio.types';
import { SplitterService } from './splitter.service';

export interface SplitterState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlobs: Blob[];
  segmentCount: number;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
  logs: string[];
}

const initialState: SplitterState = {
  inputFile: null, status: 'idle', progress: 0, outputBlobs: [],
  segmentCount: 0, errorCode: null, errorMessage: null, retryable: true, logs: []
};

export const SplitterActions = createActionGroup({
  source: '[Splitter]',
  events: {
    'Load File': props<{ file: File }>(),
    'Start Processing': props<{ format: ExportFormat, mode: 'equal' | 'silence', equalParts: number, silenceThresholdDb: number, silenceMinDurationSec: number }>(),
    'Update Progress': props<{ value: number }>(),
    'Worker Log': props<{ message: string }>(),
    'Processing Success': props<{ outputBlobs: Blob[], count: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Reset State': emptyProps(),
  }
});

export const splitterReducer = createReducer(
  initialState,
  on(SplitterActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'idle' as ProcessingStatus, errorMessage: null, errorCode: null })),
  on(SplitterActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlobs: [], segmentCount: 0, errorMessage: null, logs: [] })),
  on(SplitterActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(SplitterActions.workerLog, (s, { message }) => ({ ...s, logs: [...s.logs, message] })),
  on(SplitterActions.processingSuccess, (s, { outputBlobs, count }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlobs, segmentCount: count })),
  on(SplitterActions.processingFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(SplitterActions.resetState, () => ({ ...initialState }))
);

export const selectSplitterState = createFeatureSelector<SplitterState>('splitter');
export const selectSplitterStatus = createSelector(selectSplitterState, s => s.status);

export const processSplitterEffect = createEffect(
  (actions$ = inject(Actions), splitterService = inject(SplitterService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(SplitterActions.startProcessing),
      withLatestFrom(store.select(selectSplitterState)),
      exhaustMap(([{ format, mode, equalParts, silenceThresholdDb, silenceMinDurationSec }, state]) => {
        if (!state.inputFile) return of(SplitterActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file.' }));
        return splitterService.splitAudio(state.inputFile, format, mode, equalParts, silenceThresholdDb, silenceMinDurationSec).pipe(
          map(event => {
            if (event.type === 'progress') return SplitterActions.updateProgress({ value: event.value || 0 });
            if (event.type === 'complete' && event.data) return SplitterActions.processingSuccess({ outputBlobs: event.data.blobs, count: event.data.count });
            if (event.type === 'log' && event.message) return SplitterActions.workerLog({ message: event.message });
            return SplitterActions.updateProgress({ value: 0 });
          }),
          catchError(err => of(SplitterActions.processingFailure({ errorCode: err.errorCode || 'ENCODE_FAILED', message: err.message || 'Unknown error' })))
        );
      })
    );
  },
  { functional: true }
);
