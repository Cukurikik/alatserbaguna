import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

// ─── State ───────────────────────────────────────────────────────────────────
export interface StereoWidenerState {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: StereoWidenerState = {
  inputFile: null,
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false,
};

// ─── Actions ─────────────────────────────────────────────────────────────────
export const StereoWidenerActions = createActionGroup({
  source: '[StereoWidener]',
  events: {
    'Load File': props<{ file: File }>(),
    'Start Processing': props<{ format: ExportFormat }>(),
    'Update Progress': props<{ value: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

// ─── Reducer ─────────────────────────────────────────────────────────────────
export const stereowidenerReducer = createReducer(
  initialState,
  on(StereoWidenerActions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'idle' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(StereoWidenerActions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(StereoWidenerActions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(StereoWidenerActions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(StereoWidenerActions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(StereoWidenerActions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectStereoWidenerState = createFeatureSelector<StereoWidenerState>('stereo-widener');
export const selectStereoWidenerStatus = createSelector(selectStereoWidenerState, (s) => s.status);
export const selectStereoWidenerProgress = createSelector(selectStereoWidenerState, (s) => s.progress);
export const selectStereoWidenerOutputBlob = createSelector(selectStereoWidenerState, (s) => s.outputBlob);
export const selectStereoWidenerOutputSizeMB = createSelector(selectStereoWidenerState, (s) => s.outputSizeMB);
export const selectStereoWidenerErrorMessage = createSelector(selectStereoWidenerState, (s) => s.errorMessage);
export const selectStereoWidenerRetryable = createSelector(selectStereoWidenerState, (s) => s.retryable);
export const selectStereoWidenerInputFile = createSelector(selectStereoWidenerState, (s) => s.inputFile);

// ─── Effects ─────────────────────────────────────────────────────────────────
export const stereowidenerProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(StereoWidenerActions.startProcessing),
      withLatestFrom(store.select(selectStereoWidenerState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) {
          return of(StereoWidenerActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file selected', retryable: false }));
        }
        
        return new Observable<any>(obs => {
          let aborted = false;
          const args = ["-i","{in}","-af","extrastereo=m=2.5"]; // Feature-specific FFmpeg args
          
          ffmpeg.processAudio(
            state.inputFile!,
            format,
            args,
            (p) => { if (!aborted) store.dispatch(StereoWidenerActions.updateProgress({ value: p })); }
          ).then(blob => {
            if (!aborted) {
              obs.next(StereoWidenerActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 }));
              obs.complete();
            }
          }).catch(err => {
            if (!aborted) {
              obs.next(StereoWidenerActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Validation failed or FFmpeg crashed', retryable: true }));
              obs.complete();
            }
          });

          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);
