import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ProcessingStatus, AudioErrorCode, ExportFormat } from '../shared/types/audio.types';
import { MixerService } from './mixer.service';

export interface MixerTrackState {
  id: string;
  file: File;
  label: string;
  volume: number;  // 0–2
  pan: number;     // -1 to +1
  muted: boolean;
  soloed: boolean;
}

export interface MixerState {
  tracks: MixerTrackState[];
  masterVolume: number;
  outputMode: 'stereo' | 'mono';
  outputFormat: ExportFormat;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
  logs: string[];
}

const initialState: MixerState = {
  tracks: [], masterVolume: 1, outputMode: 'stereo', outputFormat: 'wav',
  status: 'idle', progress: 0, outputBlob: null, outputSizeMB: null,
  errorCode: null, errorMessage: null, retryable: true, logs: []
};

export const MixerActions = createActionGroup({
  source: '[Mixer]',
  events: {
    'Add Track': props<{ file: File }>(),
    'Remove Track': props<{ id: string }>(),
    'Update Track Volume': props<{ id: string; volume: number }>(),
    'Update Track Pan': props<{ id: string; pan: number }>(),
    'Toggle Track Mute': props<{ id: string }>(),
    'Toggle Track Solo': props<{ id: string }>(),
    'Set Master Volume': props<{ volume: number }>(),
    'Set Output Mode': props<{ mode: 'stereo' | 'mono' }>(),
    'Set Output Format': props<{ format: ExportFormat }>(),
    'Start Mix': emptyProps(),
    'Update Progress': props<{ value: number }>(),
    'Worker Log': props<{ message: string }>(),
    'Mix Success': props<{ outputBlob: Blob, sizeMB: number }>(),
    'Mix Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Reset State': emptyProps(),
  }
});

export const mixerReducer = createReducer(
  initialState,
  on(MixerActions.addTrack, (s, { file }) => ({
    ...s,
    tracks: [...s.tracks, {
      id: `track_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      file, label: file.name.replace(/\.[^.]+$/, ''), volume: 1, pan: 0, muted: false, soloed: false
    }]
  })),
  on(MixerActions.removeTrack, (s, { id }) => ({ ...s, tracks: s.tracks.filter(t => t.id !== id) })),
  on(MixerActions.updateTrackVolume, (s, { id, volume }) => ({ ...s, tracks: s.tracks.map(t => t.id === id ? { ...t, volume } : t) })),
  on(MixerActions.updateTrackPan, (s, { id, pan }) => ({ ...s, tracks: s.tracks.map(t => t.id === id ? { ...t, pan } : t) })),
  on(MixerActions.toggleTrackMute, (s, { id }) => ({ ...s, tracks: s.tracks.map(t => t.id === id ? { ...t, muted: !t.muted } : t) })),
  on(MixerActions.toggleTrackSolo, (s, { id }) => ({ ...s, tracks: s.tracks.map(t => t.id === id ? { ...t, soloed: !t.soloed } : t) })),
  on(MixerActions.setMasterVolume, (s, { volume }) => ({ ...s, masterVolume: volume })),
  on(MixerActions.setOutputMode, (s, { mode }) => ({ ...s, outputMode: mode })),
  on(MixerActions.setOutputFormat, (s, { format }) => ({ ...s, outputFormat: format })),
  on(MixerActions.startMix, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorMessage: null, logs: [] })),
  on(MixerActions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(MixerActions.workerLog, (s, { message }) => ({ ...s, logs: [...s.logs, message] })),
  on(MixerActions.mixSuccess, (s, { outputBlob, sizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB: sizeMB })),
  on(MixerActions.mixFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(MixerActions.resetState, () => ({ ...initialState }))
);

export const selectMixerState = createFeatureSelector<MixerState>('mixer');
export const selectMixerTracks = createSelector(selectMixerState, s => s.tracks);
export const selectMixerStatus = createSelector(selectMixerState, s => s.status);

export const processMixEffect = createEffect(
  (actions$ = inject(Actions), mixerService = inject(MixerService), store = inject(Store)) => {
    return actions$.pipe(
      ofType(MixerActions.startMix),
      withLatestFrom(store.select(selectMixerState)),
      exhaustMap(([, state]) => {
        if (state.tracks.length < 2) return of(MixerActions.mixFailure({ errorCode: 'INVALID_PARAMS', message: 'Need at least 2 tracks to mix.' }));
        const hasSolo = state.tracks.some(t => t.soloed);
        const trackConfigs = state.tracks.map(t => ({
          file: t.file,
          volume: t.muted ? 0 : (hasSolo && !t.soloed ? 0 : t.volume),
          pan: t.pan,
          muted: t.muted,
          soloed: t.soloed
        }));
        return mixerService.mixTracks(trackConfigs, state.masterVolume, state.outputMode, state.outputFormat).pipe(
          map(event => {
            if (event.type === 'progress') return MixerActions.updateProgress({ value: event.value || 0 });
            if (event.type === 'complete' && event.data) return MixerActions.mixSuccess({ outputBlob: event.data.blob, sizeMB: event.data.sizeMB });
            if (event.type === 'log' && event.message) return MixerActions.workerLog({ message: event.message });
            return MixerActions.updateProgress({ value: 0 });
          }),
          catchError(err => of(MixerActions.mixFailure({ errorCode: err.errorCode || 'ENCODE_FAILED', message: err.message || 'Mix failed' })))
        );
      })
    );
  },
  { functional: true }
);
