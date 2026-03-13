import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ProcessingStatus, AudioErrorCode, ExportFormat } from '../shared/types/audio.types';
import { ReverbService } from './reverb.service';

export interface ReverbState {
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

const initialState: ReverbState = {
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

export const ReverbActions = createActionGroup({
  source: '[Reverb]',
  events: {
    'Load File': props<{ file: File }>(),
    'Start Processing': props<{ format: ExportFormat, roomSizeMs: number, damping: number, dryMix: number, wetMix: number }>(),
    'Update Progress': props<{ value: number }>(),
    'Worker Log': props<{ message: string }>(),
    'Processing Success': props<{ outputBlob: Blob, sizeMB: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Reset State': emptyProps(),
  }
});

export const reverbReducer = createReducer(
  initialState,
  on(ReverbActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'idle' as ProcessingStatus, errorMessage: null, errorCode: null })),
  on(ReverbActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorMessage: null, logs: [] })),
  on(ReverbActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(ReverbActions.workerLog, (s, { message }) => ({ ...s, logs: [...s.logs, message] })),
  on(ReverbActions.processingSuccess, (s, { outputBlob, sizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB: sizeMB })),
  on(ReverbActions.processingFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(ReverbActions.resetState, () => ({ ...initialState }))
);

export const selectReverbState = createFeatureSelector<ReverbState>('reverb');
export const selectReverbStatus = createSelector(selectReverbState, s => s.status);

export const processReverbEffect = createEffect(
  (actions$ = inject(Actions), reverbService = inject(ReverbService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(ReverbActions.startProcessing),
      withLatestFrom(store.select(selectReverbState)),
      exhaustMap(([{ format, roomSizeMs, damping, dryMix, wetMix }, state]) => {
        if (!state.inputFile) return of(ReverbActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file selected.' }));
        
        return reverbService.applyReverb(state.inputFile, format, roomSizeMs, damping, dryMix, wetMix).pipe(
          map(event => {
            if (event.type === 'progress') {
               return ReverbActions.updateProgress({ value: event.value || 0 });
            } else if (event.type === 'complete' && event.data) {
               return ReverbActions.processingSuccess({ outputBlob: event.data.blob, sizeMB: event.data.sizeMB });
            } else if (event.type === 'log' && event.message) {
               return ReverbActions.workerLog({ message: event.message });
            }
            return ReverbActions.updateProgress({ value: 0 });
          }),
          catchError(err => of(ReverbActions.processingFailure({ 
            errorCode: err.errorCode || 'ENCODE_FAILED', 
            message: err.message || 'Unknown processing error' 
          })))
        );
      })
    );
  },
  { functional: true }
);
