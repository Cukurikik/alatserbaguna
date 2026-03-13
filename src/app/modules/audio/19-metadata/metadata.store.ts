import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ProcessingStatus, AudioErrorCode } from '../shared/types/audio.types';
import { MetadataService } from './metadata.service';
import { AudioTags } from './metadata.schema';

export interface MetadataState {
  inputFile: File | null;
  tags: AudioTags;
  stripAll: boolean;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialTags: AudioTags = {
  title: '', artist: '', albumArtist: '', album: '', year: '',
  genre: '', track: '', disc: '', comment: '', composer: '', copyright: ''
};

const initialState: MetadataState = {
  inputFile: null, tags: initialTags, stripAll: false, status: 'idle',
  progress: 0, outputBlob: null, errorCode: null, errorMessage: null, retryable: true
};

export const MetadataActions = createActionGroup({
  source: '[Metadata]',
  events: {
    'Load File': props<{ file: File }>(),
    'Update Tag': props<{ key: keyof AudioTags; value: string }>(),
    'Toggle Strip All': emptyProps(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ value: number }>(),
    'Processing Success': props<{ outputBlob: Blob }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Reset State': emptyProps(),
  }
});

export const metadataReducer = createReducer(
  initialState,
  on(MetadataActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'idle' as ProcessingStatus, outputBlob: null, errorMessage: null, tags: initialTags })),
  on(MetadataActions.updateTag, (s, { key, value }) => ({ ...s, tags: { ...s.tags, [key]: value } })),
  on(MetadataActions.toggleStripAll, (s) => ({ ...s, stripAll: !s.stripAll })),
  on(MetadataActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorMessage: null })),
  on(MetadataActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(MetadataActions.processingSuccess, (s, { outputBlob }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob })),
  on(MetadataActions.processingFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(MetadataActions.resetState, () => ({ ...initialState }))
);

export const selectMetadataState = createFeatureSelector<MetadataState>('audioMetadata');
export const selectMetadataTags = createSelector(selectMetadataState, s => s.tags);

export const processMetadataEffect = createEffect(
  (actions$ = inject(Actions), metadataService = inject(MetadataService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(MetadataActions.startProcessing),
      withLatestFrom(store.select(selectMetadataState)),
      exhaustMap(([, state]) => {
        if (!state.inputFile) return of(MetadataActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No file.' }));
        return metadataService.writeMetadata(state.inputFile, state.tags, state.stripAll).pipe(
          map(event => {
            if (event.type === 'progress') return MetadataActions.updateProgress({ value: event.value || 0 });
            if (event.type === 'complete' && event.data) return MetadataActions.processingSuccess({ outputBlob: event.data.blob });
            return MetadataActions.updateProgress({ value: 0 });
          }),
          catchError(err => of(MetadataActions.processingFailure({ errorCode: err.errorCode || 'ENCODE_FAILED', message: err.message || 'Error' })))
        );
      })
    );
  },
  { functional: true }
);
