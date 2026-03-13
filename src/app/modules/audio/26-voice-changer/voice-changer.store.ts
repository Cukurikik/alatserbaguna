import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ProcessingStatus, AudioErrorCode, ExportFormat } from '../shared/types/audio.types';
import { VoiceChangerService, VoiceEffectParams } from './voice-changer.service';

export interface VoiceChangerState {
  inputFile: File | null; status: ProcessingStatus; progress: number;
  outputBlob: Blob | null; outputSizeMB: number | null;
  errorCode: AudioErrorCode | null; errorMessage: string | null; retryable: boolean; logs: string[];
}
const initial: VoiceChangerState = { inputFile: null, status: 'idle', progress: 0, outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: true, logs: [] };

export const VoiceChangerActions = createActionGroup({
  source: '[VoiceChanger]',
  events: {
    'Load File': props<{ file: File }>(),
    'Start Processing': props<{ format: ExportFormat, params: VoiceEffectParams }>(),
    'Update Progress': props<{ value: number }>(),
    'Worker Log': props<{ message: string }>(),
    'Processing Success': props<{ outputBlob: Blob, sizeMB: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Reset State': emptyProps(),
  }
});

export const voiceChangerReducer = createReducer(
  initial,
  on(VoiceChangerActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'idle' as ProcessingStatus, outputBlob: null, errorMessage: null })),
  on(VoiceChangerActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorMessage: null, logs: [] })),
  on(VoiceChangerActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(VoiceChangerActions.workerLog, (s, { message }) => ({ ...s, logs: [...s.logs, message] })),
  on(VoiceChangerActions.processingSuccess, (s, { outputBlob, sizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB: sizeMB })),
  on(VoiceChangerActions.processingFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(VoiceChangerActions.resetState, () => ({ ...initial }))
);

export const selectVoiceChangerState = createFeatureSelector<VoiceChangerState>('voiceChanger');

export const processVoiceChangerEffect = createEffect(
  (actions$ = inject(Actions), voiceService = inject(VoiceChangerService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(VoiceChangerActions.startProcessing),
      withLatestFrom(store.select(selectVoiceChangerState)),
      exhaustMap(([{ format, params }, state]) => {
        if (!state.inputFile) return of(VoiceChangerActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No file.' }));
        return voiceService.applyEffect(state.inputFile, format, params).pipe(
          map(event => {
            if (event.type === 'progress') return VoiceChangerActions.updateProgress({ value: event.value || 0 });
            if (event.type === 'complete' && event.data) return VoiceChangerActions.processingSuccess({ outputBlob: event.data.blob, sizeMB: event.data.sizeMB });
            if (event.type === 'log' && event.message) return VoiceChangerActions.workerLog({ message: event.message });
            return VoiceChangerActions.updateProgress({ value: 0 });
          }),
          catchError(err => of(VoiceChangerActions.processingFailure({ errorCode: err.errorCode || 'ENCODE_FAILED', message: err.message || 'Error' })))
        );
      })
    );
  },
  { functional: true }
);
