import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ProcessingStatus, AudioErrorCode, ExportFormat } from '../shared/types/audio.types';
import { ChannelMixerService } from './channel-mixer.service';
import { ChannelOperation } from './channel-mixer.schema';

export interface ChannelMixerState {
  inputFile: File | null; status: ProcessingStatus; progress: number;
  outputBlob: Blob | null; outputSizeMB: number | null;
  errorCode: AudioErrorCode | null; errorMessage: string | null; retryable: boolean;
}
const initialState: ChannelMixerState = { inputFile: null, status: 'idle', progress: 0, outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: true };

export const ChannelMixerActions = createActionGroup({
  source: '[ChannelMixer]',
  events: {
    'Load File': props<{ file: File }>(),
    'Start Processing': props<{ format: ExportFormat, operation: ChannelOperation, monoMode: 'average' | 'left' | 'right' }>(),
    'Update Progress': props<{ value: number }>(),
    'Processing Success': props<{ outputBlob: Blob, sizeMB: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Reset State': emptyProps(),
  }
});

export const channelMixerReducer = createReducer(
  initialState,
  on(ChannelMixerActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'idle' as ProcessingStatus, errorMessage: null })),
  on(ChannelMixerActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorMessage: null })),
  on(ChannelMixerActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(ChannelMixerActions.processingSuccess, (s, { outputBlob, sizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB: sizeMB })),
  on(ChannelMixerActions.processingFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(ChannelMixerActions.resetState, () => ({ ...initialState }))
);

export const selectChannelMixerState = createFeatureSelector<ChannelMixerState>('channelMixer');

export const processChannelMixerEffect = createEffect(
  (actions$ = inject(Actions), channelMixerService = inject(ChannelMixerService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(ChannelMixerActions.startProcessing),
      withLatestFrom(store.select(selectChannelMixerState)),
      exhaustMap(([{ format, operation, monoMode }, state]) => {
        if (!state.inputFile) return of(ChannelMixerActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No file.' }));
        return channelMixerService.mixChannels(state.inputFile, format, operation, monoMode).pipe(
          map(event => {
            if (event.type === 'progress') return ChannelMixerActions.updateProgress({ value: event.value || 0 });
            if (event.type === 'complete' && event.data) return ChannelMixerActions.processingSuccess({ outputBlob: event.data.blob, sizeMB: event.data.sizeMB });
            return ChannelMixerActions.updateProgress({ value: 0 });
          }),
          catchError(err => of(ChannelMixerActions.processingFailure({ errorCode: err.errorCode || 'ENCODE_FAILED', message: err.message || 'Error' })))
        );
      })
    );
  },
  { functional: true }
);
