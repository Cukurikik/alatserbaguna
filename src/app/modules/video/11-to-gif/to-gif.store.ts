import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, exhaustMap } from 'rxjs';
import { of } from 'rxjs';
import { VideoMeta, ProcessingStatus, WorkerMessage } from '../shared/types/video.types';
import { VideoErrorCode, getVideoError } from '../shared/errors/video.errors';
import { ToGifInputSchema, ToGifConfig } from './to-gif.schema';
import { ToGifService } from './to-gif.service';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';

export interface ToGifState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  fps: number;
  scale: number;
  startTime: number;
  duration: number;
  quality: 'low' | 'medium' | 'high';
  dither: 'none' | 'bayer' | 'floyd_steinberg' | 'sierra2_4a';
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: ToGifState = {
  inputFile: null,
  videoMeta: null,
  fps: 15,
  scale: 480,
  startTime: 0,
  duration: 5,
  quality: 'medium',
  dither: 'bayer',
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false
};

export const ToGifStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, toGifService = inject(ToGifService), workerBridge = inject(WorkerBridgeService)) => ({
    loadFile: rxMethod<{ file: File }>(
      pipe(
        tap(({ file }) => {
          patchState(store, { inputFile: file, status: 'loading', outputBlob: null, errorMessage: null, errorCode: null });
        }),
        switchMap(({ file }) => {
          return toGifService.getMetadata(file).then(
            (meta) => {
              patchState(store, { 
                videoMeta: meta, 
                status: 'idle',
                duration: Math.min(5, meta.duration) // Default 5s or full duration
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
    updateConfig: (config: Partial<ToGifConfig>) => {
      patchState(store, config);
    },
    startProcessing: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { status: 'processing', progress: 0, outputBlob: null, errorMessage: null, errorCode: null })),
        exhaustMap(() => {
          const state = store;
          const config: ToGifConfig = {
            inputFile: state.inputFile()!,
            fps: state.fps(),
            scale: state.scale(),
            startTime: state.startTime(),
            duration: state.duration(),
            quality: state.quality(),
            dither: state.dither()
          };

          const validation = ToGifInputSchema.safeParse(config);
          if (!validation.success) {
            const err = getVideoError('INVALID_DIMENSIONS'); // Reusing error code
            patchState(store, { status: 'error', errorCode: err.code, errorMessage: err.message, retryable: err.retryable });
            return of(null);
          }

          return new Promise<void>((resolve) => {
            (async () => {
              try {
                const { buffer } = await workerBridge.buildTransferable(config.inputFile);
                const workerFactory = () => new Worker(new URL('./to-gif.worker', import.meta.url), { type: 'module' });
                
                workerBridge.process<ToGifConfig & { fileBuffer: ArrayBuffer, fileName: string }, Uint8Array>(workerFactory, {
                  inputFile: config.inputFile,
                  fileBuffer: buffer,
                  fileName: config.inputFile.name,
                  fps: config.fps,
                  scale: config.scale,
                  startTime: config.startTime,
                  duration: config.duration,
                  dither: config.dither,
                  quality: config.quality
                }).subscribe({
                  next: (msg: WorkerMessage<Uint8Array>) => {
                    if (msg.type === 'progress') {
                      patchState(store, { progress: msg.value! });
                    } else if (msg.type === 'complete') {
                      const buffer = msg.data!.buffer;
                      const arrayBuffer = buffer instanceof SharedArrayBuffer ? buffer.slice(0) : buffer;
                      const blob = new Blob([new Uint8Array(arrayBuffer as unknown as ArrayBuffer)], { type: 'image/gif' });
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
      a.download = `omni_gif_${store.inputFile()?.name.split('.')[0] || 'video'}.gif`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 150);
    },
    resetState: () => {
      patchState(store, initialState);
    }
  }))
);
