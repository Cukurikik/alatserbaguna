import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, exhaustMap } from 'rxjs';
import { of } from 'rxjs';
import { VideoMeta, ProcessingStatus, WorkerMessage } from '../shared/types/video.types';
import { VideoErrorCode, getVideoError } from '../shared/errors/video.errors';
import { LooperInputSchema, LooperConfig } from './looper.schema';
import { LooperService } from './looper.service';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';

export interface LooperState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  mode: 'count' | 'duration';
  loopCount: number;
  targetDuration: number;
  crossfade: boolean;
  crossfadeDuration: number;
  outputDuration: number;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: LooperState = {
  inputFile: null,
  videoMeta: null,
  mode: 'count',
  loopCount: 2,
  targetDuration: 60,
  crossfade: false,
  crossfadeDuration: 0.5,
  outputDuration: 0,
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false
};

export const LooperStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, looperService = inject(LooperService), workerBridge = inject(WorkerBridgeService)) => ({
    loadFile: rxMethod<{ file: File }>(
      pipe(
        tap(({ file }) => {
          patchState(store, { inputFile: file, status: 'loading', outputBlob: null, errorMessage: null, errorCode: null });
        }),
        switchMap(({ file }) => {
          return looperService.getMetadata(file).then(
            (meta) => {
              patchState(store, { 
                videoMeta: meta, 
                status: 'idle',
                outputDuration: looperService.calculateOutputDuration(store.mode(), store.loopCount(), meta.duration, store.targetDuration())
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
    updateConfig: (config: Partial<LooperConfig>) => {
      patchState(store, config);
      if (store.videoMeta()) {
        patchState(store, {
          outputDuration: looperService.calculateOutputDuration(
            store.mode(),
            store.loopCount(),
            store.videoMeta()!.duration,
            store.targetDuration()
          )
        });
      }
    },
    startProcessing: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { status: 'processing', progress: 0, outputBlob: null, errorMessage: null, errorCode: null })),
        exhaustMap(() => {
          const state = store;
          const config: LooperConfig = {
            inputFile: state.inputFile()!,
            mode: state.mode(),
            loopCount: state.loopCount(),
            targetDuration: state.targetDuration(),
            crossfade: state.crossfade(),
            crossfadeDuration: state.crossfadeDuration()
          };

          const validation = LooperInputSchema.safeParse(config);
          if (!validation.success) {
            const err = getVideoError('INVALID_TIME_RANGE');
            patchState(store, { status: 'error', errorCode: err.code, errorMessage: err.message, retryable: err.retryable });
            return of(null);
          }

          return new Promise<void>((resolve) => {
            (async () => {
              try {
                const { buffer } = await workerBridge.buildTransferable(config.inputFile);
                const workerFactory = () => new Worker(new URL('./looper.worker', import.meta.url), { type: 'module' });
                
                workerBridge.process<LooperConfig & { fileBuffer: ArrayBuffer, fileName: string, clipDuration: number }, Uint8Array>(workerFactory, {
                  inputFile: config.inputFile,
                  fileBuffer: buffer,
                  fileName: config.inputFile.name,
                  mode: config.mode,
                  loopCount: config.loopCount,
                  targetDuration: config.targetDuration,
                  crossfade: config.crossfade,
                  crossfadeDuration: config.crossfadeDuration,
                  clipDuration: state.videoMeta()!.duration
                }).subscribe({
                  next: (msg: WorkerMessage<Uint8Array>) => {
                    if (msg.type === 'progress') {
                      patchState(store, { progress: msg.value! });
                    } else if (msg.type === 'complete') {
                      const buffer = msg.data!.buffer;
                      const arrayBuffer = buffer instanceof SharedArrayBuffer ? buffer.slice(0) : buffer;
                      const blob = new Blob([new Uint8Array(arrayBuffer)], { type: 'video/mp4' });
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
      a.download = `omni_looped_${store.inputFile()?.name || 'video.mp4'}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 150);
    },
    resetState: () => {
      patchState(store, initialState);
    }
  }))
);
