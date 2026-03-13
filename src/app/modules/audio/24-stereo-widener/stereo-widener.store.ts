import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface StereoWidenerState {
  inputFile: File | null;
  audioMeta: AudioMeta | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}
const initialState: StereoWidenerState = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,
};
export const StereoWidenerActions = createActionGroup({
  source: '[StereoWidener]', events: {
    'Load File': props<{ file: File }>(),
    'Load File Success': props<{ meta: AudioMeta }>(),
    'Load File Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Start Processing': props<{ format: ExportFormat }>(),
    'Update Progress': props<{ value: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string; retryable: boolean }>(),
    'Download Output': emptyProps(),
    'Reset State': emptyProps(),
  }
});
export const stereoWidenerReducer = createReducer(
  initialState,
  on(StereoWidenerActions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(StereoWidenerActions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(StereoWidenerActions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(StereoWidenerActions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(StereoWidenerActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(StereoWidenerActions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(StereoWidenerActions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(StereoWidenerActions.resetState, () => ({ ...initialState })),
);
export const selectStereoWidenerState = createFeatureSelector<StereoWidenerState>('stereo-widener');
export const selectStereoWidenerStatus = createSelector(selectStereoWidenerState, s => s.status);
export const selectStereoWidenerInputFile = createSelector(selectStereoWidenerState, s => s.inputFile);
export const selectStereoWidenerAudioMeta = createSelector(selectStereoWidenerState, s => s.audioMeta);
export const selectStereoWidenerOutputBlob = createSelector(selectStereoWidenerState, s => s.outputBlob);
export const selectStereoWidenerOutputSizeMB = createSelector(selectStereoWidenerState, s => s.outputSizeMB);
export const selectStereoWidenerIsLoading = createSelector(selectStereoWidenerState, s => s.status === 'loading' || s.status === 'processing');
export const selectStereoWidenerIsDone = createSelector(selectStereoWidenerState, s => s.status === 'done');
export const selectStereoWidenerHasError = createSelector(selectStereoWidenerState, s => s.status === 'error');
export const selectStereoWidenerErrorMessage = createSelector(selectStereoWidenerState, s => s.errorMessage);
export const selectStereoWidenerRetryable = createSelector(selectStereoWidenerState, s => s.retryable);
export const selectStereoWidenerCanProcess = createSelector(selectStereoWidenerState, s => !!s.inputFile && s.status === 'idle');

export const stereoWidenerProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(StereoWidenerActions.startProcessing),
      withLatestFrom(store.select(selectStereoWidenerState)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(StereoWidenerActions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(StereoWidenerActions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(StereoWidenerActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(StereoWidenerActions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);

export const stereowidenerReducer = stereoWidenerReducer;
export const stereowidenerProcessingEffect = stereoWidenerProcessingEffect;