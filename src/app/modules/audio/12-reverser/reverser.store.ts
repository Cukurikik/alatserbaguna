import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ProcessingStatus, AudioErrorCode, ExportFormat } from '../shared/types/audio.types';
import { ReverserService } from './reverser.service';

export interface ReverserState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
  logs: string[];
}

const initialState: ReverserState = {
  inputFile: null,
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: true,
  logs: []
};

export const ReverserActions = createActionGroup({
  source: '[Reverser]',
  events: {
    'Load File': props<{ file: File }>(),
    'Start Processing': props<{ format: ExportFormat, crossfadeEdges: boolean }>(),
    'Update Progress': props<{ value: number }>(),
    'Worker Log': props<{ message: string }>(),
    'Processing Success': props<{ outputBlob: Blob, sizeMB: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Reset State': emptyProps(),
  }
});

export const reverserReducer = createReducer(
  initialState,
  on(ReverserActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'idle' as ProcessingStatus, errorMessage: null, errorCode: null })),
  on(ReverserActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorMessage: null, logs: [] })),
  on(ReverserActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(ReverserActions.workerLog, (s, { message }) => ({ ...s, logs: [...s.logs, message] })),
  on(ReverserActions.processingSuccess, (s, { outputBlob, sizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB: sizeMB })),
  on(ReverserActions.processingFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(ReverserActions.resetState, () => ({ ...initialState }))
);

export const selectReverserState = createFeatureSelector<ReverserState>('reverser');
export const selectReverserStatus = createSelector(selectReverserState, s => s.status);

export const processReverserEffect = createEffect(
  (actions$ = inject(Actions), reverserService = inject(ReverserService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(ReverserActions.startProcessing),
      withLatestFrom(store.select(selectReverserState)),
      exhaustMap(([{ format, crossfadeEdges }, state]) => {
        if (!state.inputFile) return of(ReverserActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file selected.' }));
        
        return reverserService.applyReverse(state.inputFile, format, crossfadeEdges).pipe(
          map(event => {
            if (event.type === 'progress') {
               return ReverserActions.updateProgress({ value: event.value || 0 });
            } else if (event.type === 'complete' && event.data) {
               return ReverserActions.processingSuccess({ outputBlob: event.data.blob, sizeMB: event.data.sizeMB });
            } else if (event.type === 'log' && event.message) {
               return ReverserActions.workerLog({ message: event.message });
            }
            return ReverserActions.updateProgress({ value: 0 });
          }),
          catchError(err => of(ReverserActions.processingFailure({ 
            errorCode: err.errorCode || 'ENCODE_FAILED', 
            message: err.message || 'Unknown processing error' 
          })))
        );
      })
    );
  },
  { functional: true }
);
