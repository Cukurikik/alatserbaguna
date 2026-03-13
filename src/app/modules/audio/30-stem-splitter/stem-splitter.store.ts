import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ProcessingStatus, AudioErrorCode, ExportFormat } from '../shared/types/audio.types';
import { StemSplitterService } from './stem-splitter.service';
import { StemLabel, StemOutput } from './stem-splitter.schema';

export interface StemSplitterState {
  inputFile: File | null; status: ProcessingStatus; progress: number;
  stems: StemOutput[];
  errorCode: AudioErrorCode | null; errorMessage: string | null; retryable: boolean; logs: string[];
}
const initial: StemSplitterState = {
  inputFile: null, status: 'idle', progress: 0,
  stems: [],
  errorCode: null, errorMessage: null, retryable: true, logs: []
};

export const StemSplitterActions = createActionGroup({
  source: '[StemSplitter]',
  events: {
    'Load File': props<{ file: File }>(),
    'Start Processing': props<{ format: ExportFormat, selectedStems: StemLabel[] }>(),
    'Update Progress': props<{ value: number }>(),
    'Worker Log': props<{ message: string }>(),
    'Processing Success': props<{ stems: StemOutput[] }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Reset State': emptyProps(),
  }
});

export const stemSplitterReducer = createReducer(
  initial,
  on(StemSplitterActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'idle' as ProcessingStatus, stems: [], errorMessage: null })),
  on(StemSplitterActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, stems: [], errorMessage: null, logs: [] })),
  on(StemSplitterActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(StemSplitterActions.workerLog, (s, { message }) => ({ ...s, logs: [...s.logs, message] })),
  on(StemSplitterActions.processingSuccess, (s, { stems }) => ({ ...s, status: 'done' as ProcessingStatus, stems })),
  on(StemSplitterActions.processingFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(StemSplitterActions.resetState, () => ({ ...initial }))
);

export const selectStemSplitterState = createFeatureSelector<StemSplitterState>('stemSplitter');

export const processStemSplitterEffect = createEffect(
  (actions$ = inject(Actions), stemService = inject(StemSplitterService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(StemSplitterActions.startProcessing),
      withLatestFrom(store.select(selectStemSplitterState)),
      exhaustMap(([{ format, selectedStems }, state]) => {
        if (!state.inputFile) return of(StemSplitterActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No file.' }));
        return stemService.splitStems(state.inputFile, format, selectedStems).pipe(
          map(event => {
            if (event.type === 'progress') return StemSplitterActions.updateProgress({ value: event.value || 0 });
            if (event.type === 'complete' && event.data) return StemSplitterActions.processingSuccess({ stems: event.data.stems });
            if (event.type === 'log' && event.message) return StemSplitterActions.workerLog({ message: event.message });
            return StemSplitterActions.updateProgress({ value: 0 });
          }),
          catchError(err => of(StemSplitterActions.processingFailure({ errorCode: err.errorCode || 'ENCODE_FAILED', message: err.message || 'Error' })))
        );
      })
    );
  },
  { functional: true }
);