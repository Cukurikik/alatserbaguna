import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ProcessingStatus, AudioErrorCode, ExportFormat } from '../shared/types/audio.types';
import { NoiseRemoverService } from './noise-remover.service';

export interface NoiseRemoverState {
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

const initialState: NoiseRemoverState = {
  inputFile: null, status: 'idle', progress: 0, outputBlob: null,
  outputSizeMB: null, errorCode: null, errorMessage: null, retryable: true, logs: []
};

export const NoiseRemoverActions = createActionGroup({
  source: '[NoiseRemover]',
  events: {
    'Load File': props<{ file: File }>(),
    'Start Processing': props<{ format: ExportFormat, strength: number, noiseFloor: number }>(),
    'Update Progress': props<{ value: number }>(),
    'Worker Log': props<{ message: string }>(),
    'Processing Success': props<{ outputBlob: Blob, sizeMB: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Reset State': emptyProps(),
  }
});

export const noiseRemoverReducer = createReducer(
  initialState,
  on(NoiseRemoverActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'idle' as ProcessingStatus, errorMessage: null, errorCode: null })),
  on(NoiseRemoverActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorMessage: null, logs: [] })),
  on(NoiseRemoverActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(NoiseRemoverActions.workerLog, (s, { message }) => ({ ...s, logs: [...s.logs, message] })),
  on(NoiseRemoverActions.processingSuccess, (s, { outputBlob, sizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB: sizeMB })),
  on(NoiseRemoverActions.processingFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(NoiseRemoverActions.resetState, () => ({ ...initialState }))
);

export const selectNoiseRemoverState = createFeatureSelector<NoiseRemoverState>('noiseRemover');
export const selectNoiseRemoverStatus = createSelector(selectNoiseRemoverState, s => s.status);

export const processNoiseRemoverEffect = createEffect(
  (actions$ = inject(Actions), noiseRemoverService = inject(NoiseRemoverService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(NoiseRemoverActions.startProcessing),
      withLatestFrom(store.select(selectNoiseRemoverState)),
      exhaustMap(([{ format, strength, noiseFloor }, state]) => {
        if (!state.inputFile) return of(NoiseRemoverActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file.' }));
        return noiseRemoverService.applyNoiseRemoval(state.inputFile, format, strength, noiseFloor).pipe(
          map(event => {
            if (event.type === 'progress') return NoiseRemoverActions.updateProgress({ value: event.value || 0 });
            if (event.type === 'complete' && event.data) return NoiseRemoverActions.processingSuccess({ outputBlob: event.data.blob, sizeMB: event.data.sizeMB });
            if (event.type === 'log' && event.message) return NoiseRemoverActions.workerLog({ message: event.message });
            return NoiseRemoverActions.updateProgress({ value: 0 });
          }),
          catchError(err => of(NoiseRemoverActions.processingFailure({ errorCode: err.errorCode || 'ENCODE_FAILED', message: err.message || 'Unknown error' })))
        );
      })
    );
  },
  { functional: true }
);
