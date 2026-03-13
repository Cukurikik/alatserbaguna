import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, switchMap, exhaustMap, map, of, tap } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ExportFormat, AudioErrorCode } from '../shared/types/audio.types';
import { RecorderService } from './recorder.service';

export interface RecorderState {
  status: 'idle' | 'requesting' | 'recording' | 'paused' | 'processing' | 'done' | 'error';
  audioSource: 'mic' | 'system' | 'both';
  selectedDeviceId: string | null;
  duration: number;
  chunks: Blob[];
  outputFormat: ExportFormat;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: RecorderState = {
  status: 'idle',
  audioSource: 'mic',
  selectedDeviceId: null,
  duration: 0,
  chunks: [],
  outputFormat: 'wav',
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: true
};

export const RecorderActions = createActionGroup({
  source: '[Recorder]',
  events: {
    'Start Recording': props<{ source: 'mic' | 'system' | 'both', deviceId: string | null }>(),
    'Stream Ready': emptyProps(),
    'Pause Recording': emptyProps(),
    'Resume Recording': emptyProps(),
    'Stop Recording': emptyProps(),
    'Update Duration': props<{ seconds: number }>(),
    'Chunk Received': props<{ blob: Blob }>(),
    'Recording Complete': props<{ outputBlob: Blob, sizeMB: number }>(),
    'Recording Failure': props<{ errorCode: AudioErrorCode, message: string, retryable: boolean }>(),
    'Set Output Format': props<{ format: ExportFormat }>(),
    'Reset State': emptyProps(),
  }
});

export const recorderReducer = createReducer(
  initialState,
  on(RecorderActions.startRecording, (s, { source, deviceId }) => ({ ...s, status: 'requesting', audioSource: source, selectedDeviceId: deviceId, duration: 0, chunks: [], errorMessage: null, errorCode: null })),
  on(RecorderActions.streamReady, (s) => ({ ...s, status: 'recording' })),
  on(RecorderActions.pauseRecording, (s) => ({ ...s, status: 'paused' })),
  on(RecorderActions.resumeRecording, (s) => ({ ...s, status: 'recording' })),
  on(RecorderActions.stopRecording, (s) => ({ ...s, status: 'processing' })),
  on(RecorderActions.updateDuration, (s, { seconds }) => ({ ...s, duration: seconds })),
  on(RecorderActions.chunkReceived, (s, { blob }) => ({ ...s, chunks: [...s.chunks, blob] })),
  on(RecorderActions.recordingComplete, (s, { outputBlob, sizeMB }) => ({ ...s, status: 'done', outputBlob, outputSizeMB: sizeMB })),
  on(RecorderActions.recordingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error', errorCode, errorMessage: message, retryable })),
  on(RecorderActions.setOutputFormat, (s, { format }) => ({ ...s, outputFormat: format })),
  on(RecorderActions.resetState, () => ({ ...initialState }))
);

export const selectRecorderState = createFeatureSelector<RecorderState>('recorder');
export const selectRecorderStatus = createSelector(selectRecorderState, s => s.status);
export const selectDuration = createSelector(selectRecorderState, s => s.duration);
export const selectOutputBlob = createSelector(selectRecorderState, s => s.outputBlob);
export const selectOutputSizeMB = createSelector(selectRecorderState, s => s.outputSizeMB);

export const startRecordingEffect$ = createEffect(
  (actions$ = inject(Actions), recorderService = inject(RecorderService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(RecorderActions.startRecording),
      switchMap(({ source, deviceId }) => {
        return new Promise<any>((resolve) => {
          recorderService.requestStream(source, deviceId).then(() => {
            resolve(RecorderActions.streamReady());
            
            // start recorder
            recorderService.startRecording((blob) => {
               store.dispatch(RecorderActions.chunkReceived({ blob }));
            });
            
          }).catch((err: any) => {
            resolve(RecorderActions.recordingFailure({ 
              errorCode: 'MIC_PERMISSION_DENIED', 
              message: err.message || 'Permission denied or no stream available.', 
              retryable: true 
            }));
          });
        });
      })
    );
  },
  { functional: true }
);

export const stopRecordingEffect$ = createEffect(
  (actions$ = inject(Actions), recorderService = inject(RecorderService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(RecorderActions.stopRecording),
      withLatestFrom(store.select(selectRecorderState)),
      exhaustMap(([_, state]) => {
        recorderService.stopRecording();
        // create blob from chunks immediately
        const combined = new Blob(state.chunks, { type: 'audio/webm' });
        const sizeMB = combined.size / (1024 * 1024);
        
        // normally we would send this WebM to FFmpegAudioService to encode to target outputFormat (WAV/MP3/etc)
        // for now just return the raw webm blob
        return of(RecorderActions.recordingComplete({ outputBlob: combined, sizeMB }));
      })
    );
  },
  { functional: true }
);

export const pauseResumeEffect$ = createEffect(
  (actions$ = inject(Actions), recorderService = inject(RecorderService)) => {
    return actions$.pipe(
      ofType(RecorderActions.pauseRecording, RecorderActions.resumeRecording),
      tap((action) => {
        if (action.type === RecorderActions.pauseRecording.type) {
           recorderService.pauseRecording();
        } else {
           recorderService.resumeRecording();
        }
      })
    );
  },
  { functional: true, dispatch: false }
);

export const cleanupEffect$ = createEffect(
  (actions$ = inject(Actions), recorderService = inject(RecorderService)) => {
    return actions$.pipe(
      ofType(RecorderActions.resetState),
      tap(() => {
        recorderService.cleanup();
      })
    );
  },
  { functional: true, dispatch: false }
);

export const recorderProcessingEffect = startRecordingEffect$;
