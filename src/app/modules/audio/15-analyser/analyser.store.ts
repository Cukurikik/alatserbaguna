import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ProcessingStatus, AudioErrorCode } from '../shared/types/audio.types';
import { AnalyserService } from './analyser.service';
import { AnalysisResult } from './analyser.schema';

export interface AnalyserState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  result: AnalysisResult | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: AnalyserState = {
  inputFile: null, status: 'idle', progress: 0, result: null,
  errorCode: null, errorMessage: null, retryable: true
};

export const AnalyserActions = createActionGroup({
  source: '[Analyser]',
  events: {
    'Load File': props<{ file: File }>(),
    'Start Analysis': emptyProps(),
    'Update Progress': props<{ value: number }>(),
    'Analysis Success': props<{ result: AnalysisResult }>(),
    'Analysis Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Reset State': emptyProps(),
  }
});

export const analyserReducer = createReducer(
  initialState,
  on(AnalyserActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'idle' as ProcessingStatus, result: null, errorMessage: null })),
  on(AnalyserActions.startAnalysis, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, result: null, errorMessage: null })),
  on(AnalyserActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(AnalyserActions.analysisSuccess, (s, { result }) => ({ ...s, status: 'done' as ProcessingStatus, result })),
  on(AnalyserActions.analysisFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(AnalyserActions.resetState, () => ({ ...initialState }))
);

export const selectAnalyserState = createFeatureSelector<AnalyserState>('analyser');
export const selectAnalyserStatus = createSelector(selectAnalyserState, s => s.status);
export const selectAnalyserResult = createSelector(selectAnalyserState, s => s.result);

export const processAnalyserEffect = createEffect(
  (actions$ = inject(Actions), analyserService = inject(AnalyserService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(AnalyserActions.startAnalysis),
      withLatestFrom(store.select(selectAnalyserState)),
      exhaustMap(([, state]) => {
        if (!state.inputFile) return of(AnalyserActions.analysisFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file.' }));
        return analyserService.analyseFile(state.inputFile).pipe(
          map(event => {
            if (event.type === 'progress') return AnalyserActions.updateProgress({ value: event.value || 0 });
            if (event.type === 'complete' && event.data) return AnalyserActions.analysisSuccess({ result: event.data });
            return AnalyserActions.updateProgress({ value: 0 });
          }),
          catchError(err => of(AnalyserActions.analysisFailure({ errorCode: err.errorCode || 'DECODE_FAILED', message: err.message || 'Unknown error' })))
        );
      })
    );
  },
  { functional: true }
);

export const analyserProcessingEffect = processAnalyserEffect;
