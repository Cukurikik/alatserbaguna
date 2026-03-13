import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ProcessingStatus, AudioErrorCode, ExportFormat } from '../shared/types/audio.types';
import { StereoWidenerService } from './stereo-widener.service';

export interface StereoWidenerState {
  inputFile: File | null; status: ProcessingStatus; progress: number;
  outputBlob: Blob | null; outputSizeMB: number | null;
  errorCode: AudioErrorCode | null; errorMessage: string | null; retryable: boolean; logs: string[];
}
const initial: StereoWidenerState = { inputFile: null, status: 'idle', progress: 0, outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: true, logs: [] };

export const StereoWidenerActions = createActionGroup({
  source: '[StereoWidener]',
  events: {
    'Load File': props<{ file: File }>(),
    'Start Processing': props<{ format: ExportFormat, width: number, mode: 'stereotools' | 'extrastereo' }>(),
    'Update Progress': props<{ value: number }>(),
    'Worker Log': props<{ message: string }>(),
    'Processing Success': props<{ outputBlob: Blob, sizeMB: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Reset State': emptyProps(),
  }
});

export const stereoWidenerReducer = createReducer(
  initial,
  on(StereoWidenerActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'idle' as ProcessingStatus, outputBlob: null, errorMessage: null })),
  on(StereoWidenerActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorMessage: null, logs: [] })),
  on(StereoWidenerActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(StereoWidenerActions.workerLog, (s, { message }) => ({ ...s, logs: [...s.logs, message] })),
  on(StereoWidenerActions.processingSuccess, (s, { outputBlob, sizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB: sizeMB })),
  on(StereoWidenerActions.processingFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(StereoWidenerActions.resetState, () => ({ ...initial }))
);

export const selectStereoWidenerState = createFeatureSelector<StereoWidenerState>('stereoWidener');

export const processStereoWidenerEffect = createEffect(
  (actions$ = inject(Actions), stereoService = inject(StereoWidenerService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(StereoWidenerActions.startProcessing),
      withLatestFrom(store.select(selectStereoWidenerState)),
      exhaustMap(([{ format, width, mode }, state]) => {
        if (!state.inputFile) return of(StereoWidenerActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No file.' }));
        return stereoService.applyWidening(state.inputFile, format, width, mode).pipe(
          map(event => {
            if (event.type === 'progress') return StereoWidenerActions.updateProgress({ value: event.value || 0 });
            if (event.type === 'complete' && event.data) return StereoWidenerActions.processingSuccess({ outputBlob: event.data.blob, sizeMB: event.data.sizeMB });
            if (event.type === 'log' && event.message) return StereoWidenerActions.workerLog({ message: event.message });
            return StereoWidenerActions.updateProgress({ value: 0 });
          }),
          catchError(err => of(StereoWidenerActions.processingFailure({ errorCode: err.errorCode || 'ENCODE_FAILED', message: err.message || 'Error' })))
        );
      })
    );
  },
  { functional: true }
);
