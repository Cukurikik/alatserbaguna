import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, exhaustMap } from 'rxjs';
import { of } from 'rxjs';
import { VideoMeta, ProcessingStatus, WorkerMessage } from '../shared/types/video.types';
import { VideoErrorCode, getVideoError } from '../shared/errors/video.errors';
import { SpeedInputSchema, SpeedConfig } from './speed-controller.schema';
import { SpeedControllerService } from './speed-controller.service';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';

export interface SpeedState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  speed: number;
  audioMode: 'keep' | 'mute' | 'pitchCorrect';
  originalDuration: number;
  newDuration: number;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: SpeedState = {
  inputFile: null,
  videoMeta: null,
  speed: 1.0,
  audioMode: 'keep',
  originalDuration: 0,
  newDuration: 0,
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false
};

export const SpeedStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, speedService = inject(SpeedControllerService), workerBridge = inject(WorkerBridgeService)) => ({
    loadFile: rxMethod<{ file: File }>(
      pipe(
        tap(({ file }) => {
          patchState(store, { inputFile: file, status: 'loading', outputBlob: null, errorMessage: null, errorCode: null });
        }),
        switchMap(({ file }) => {
          return speedService.getMetadata(file).then(
            (meta) => {
              patchState(store, { 
                videoMeta: meta, 
                status: 'idle', 
                originalDuration: meta.duration,
                newDuration: speedService.calculateNewDuration(meta.duration, store.speed())
              });
            },
            () => {
              const err = getVideoError('FILE_CORRUPTED');
              patchState(store, { status: 'error', errorCode: err.code, errorMessage: err.message, retryable: err.retryable });
            }
          );
        })
      )
    ),
    updateConfig: (config: Partial<SpeedConfig>) => {
      patchState(store, config);
      if (config.speed && store.originalDuration() > 0) {
        patchState(store, { newDuration: speedService.calculateNewDuration(store.originalDuration(), config.speed) });
      }
    },
    startProcessing: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { status: 'processing', progress: 0, outputBlob: null, errorMessage: null, errorCode: null })),
        exhaustMap(() => {
          const state = store;
          const config: SpeedConfig = {
            inputFile: state.inputFile()!,
            speed: state.speed(),
            audioMode: state.audioMode()
          };

          const validation = SpeedInputSchema.safeParse(config);
          if (!validation.success) {
            const err = getVideoError('INVALID_SPEED');
            patchState(store, { status: 'error', errorCode: err.code, errorMessage: err.message, retryable: err.retryable });
            return of(null);
          }

          return new Promise<void>((resolve) => {
            (async () => {
              try {
                const { buffer } = await workerBridge.buildTransferable(config.inputFile);
                const workerFactory = () => new Worker(new URL('./speed-controller.worker', import.meta.url), { type: 'module' });
                
                workerBridge.process<SpeedConfig & { fileBuffer: ArrayBuffer, fileName: string }, Uint8Array>(workerFactory, {
                  inputFile: config.inputFile,
                  fileBuffer: buffer,
                  fileName: config.inputFile.name,
                  speed: config.speed,
                  audioMode: config.audioMode
                }).subscribe({
                  next: (msg: WorkerMessage<Uint8Array>) => {
                    if (msg.type === 'progress') {
                      patchState(store, { progress: msg.value! });
                    } else if (msg.type === 'complete') {
                      const buffer = msg.data!.buffer;
                      const arrayBuffer = buffer instanceof SharedArrayBuffer ? buffer.slice(0) : buffer;
                      const blob = new Blob([new Uint8Array(arrayBuffer as any)], { type: 'video/mp4' });
                      patchState(store, {
                        status: 'done',
                        progress: 100,
                        outputBlob: blob,
                        outputSizeMB: blob.size / (1024 * 1024)
                      });
                      resolve();
                    }
                  },
                  error: (err) => {
                    const videoErr = getVideoError(err.code || 'WORKER_CRASHED');
                    patchState(store, { status: 'error', errorCode: videoErr.code, errorMessage: videoErr.message, retryable: videoErr.retryable });
                    resolve();
                  }
                });
              } catch {
                const videoErr = getVideoError('WORKER_INIT_FAILED');
                patchState(store, { status: 'error', errorCode: videoErr.code, errorMessage: videoErr.message, retryable: videoErr.retryable });
                resolve();
              }
            })();
          });
        })
      )
    ),
    downloadOutput: () => {
      const blob = store.outputBlob();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `omni_speed_${store.inputFile()?.name || 'video.mp4'}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 150);
    },
    resetState: () => {
      patchState(store, initialState);
    }
  }))
);
