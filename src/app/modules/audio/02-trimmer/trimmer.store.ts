import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, concatMap, exhaustMap, map, of, tap } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ProcessingStatus, AudioErrorCode, ExportFormat } from '../shared/types/audio.types';
import { TrimmerService } from './trimmer.service';

export interface TrimmerState {
  inputFile: File | null;
  waveformPeaks: number[];
  durationMs: number;
  startTimeMs: number;
  endTimeMs: number;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: TrimmerState = {
  inputFile: null,
  waveformPeaks: [],
  durationMs: 0,
  startTimeMs: 0,
  endTimeMs: 0,
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: true
};

export const TrimmerActions = createActionGroup({
  source: '[Trimmer]',
  events: {
    'Load File': props<{ file: File }>(),
    'Waveform Extracted': props<{ peaks: number[], durationMs: number }>(),
    'Set In Point': props<{ ms: number }>(),
    'Set Out Point': props<{ ms: number }>(),
    'Start Processing': props<{ format: ExportFormat }>(),
    'Update Progress': props<{ value: number }>(),
    'Processing Success': props<{ outputBlob: Blob, sizeMB: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Reset State': emptyProps(),
  }
});

export const trimmerReducer = createReducer(
  initialState,
  on(TrimmerActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, errorMessage: null, errorCode: null })),
  on(TrimmerActions.waveformExtracted, (s, { peaks, durationMs }) => ({ 
    ...s, 
    waveformPeaks: peaks, 
    durationMs, 
    startTimeMs: 0, 
    endTimeMs: durationMs, 
    status: 'idle' as ProcessingStatus 
  })),
  on(TrimmerActions.setInPoint, (s, { ms }) => ({ ...s, startTimeMs: Math.max(0, Math.min(ms, s.endTimeMs - 100)) })),
  on(TrimmerActions.setOutPoint, (s, { ms }) => ({ ...s, endTimeMs: Math.max(s.startTimeMs + 100, Math.min(ms, s.durationMs)) })),
  on(TrimmerActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorMessage: null })),
  on(TrimmerActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(TrimmerActions.processingSuccess, (s, { outputBlob, sizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB: sizeMB })),
  on(TrimmerActions.processingFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(TrimmerActions.resetState, () => ({ ...initialState }))
);

export const selectTrimmerState = createFeatureSelector<TrimmerState>('trimmer');
export const selectTrimmerStatus = createSelector(selectTrimmerState, s => s.status);

export const extractWaveformEffect = createEffect(
  (actions$ = inject(Actions), trimmerService = inject(TrimmerService)) => {
    return actions$.pipe(
      ofType(TrimmerActions.loadFile),
      concatMap(({ file }) => {
        return trimmerService.extractWaveformData(file).then(
          res => TrimmerActions.waveformExtracted(res)
        ).catch(err => 
          TrimmerActions.processingFailure({ errorCode: 'DECODE_FAILED', message: 'Failed to extract waveform: ' + err.message })
        );
      })
    );
  },
  { functional: true }
);

export const processTrimmerEffect = createEffect(
  (actions$ = inject(Actions), trimmerService = inject(TrimmerService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(TrimmerActions.startProcessing),
      withLatestFrom(store.select(selectTrimmerState)),
      exhaustMap(([{ format }, state]) => {
        if (!state.inputFile) return of(TrimmerActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file' }));
        
        return trimmerService.trimAudio(state.inputFile, state.startTimeMs, state.endTimeMs, format).pipe(
          map(event => {
            if (event.type === 'progress') {
              return TrimmerActions.updateProgress({ value: event.value || 0 });
            } else if (event.type === 'complete' && event.data) {
              return TrimmerActions.processingSuccess({ outputBlob: event.data.blob, sizeMB: event.data.sizeMB });
            }
            return TrimmerActions.updateProgress({ value: 0 }); // Fallback
          }),
          catchError(err => of(TrimmerActions.processingFailure({ 
            errorCode: err.errorCode || 'ENCODE_FAILED', 
            message: err.message || 'Unknown processing error' 
          })))
        );
      })
    );
  },
  { functional: true }
);
