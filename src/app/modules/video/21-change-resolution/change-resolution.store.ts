import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, exhaustMap } from 'rxjs';
import { of } from 'rxjs';
import { VideoMeta, ProcessingStatus, WorkerMessage } from '../shared/types/video.types';
import { VideoErrorCode, getVideoError } from '../shared/errors/video.errors';
import { ChangeResolutionInputSchema, ChangeResolutionConfig } from './change-resolution.schema';
import { ChangeResolutionService } from './change-resolution.service';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';

export interface ChangeResolutionState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  width: number;
  height: number;
  maintainAspectRatio: boolean;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: ChangeResolutionState = {
  inputFile: null,
  videoMeta: null,
  width: 1920,
  height: 1080,
  maintainAspectRatio: true,
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false
};

export const ChangeResolutionStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, changeResolutionService = inject(ChangeResolutionService), workerBridge = inject(WorkerBridgeService)) => ({
    loadFile: rxMethod<{ file: File }>(
      pipe(
        tap(({ file }) => {
          patchState(store, { inputFile: file, status: 'loading', outputBlob: null, errorMessage: null, errorCode: null });
        }),
        switchMap(({ file }) => {
          return changeResolutionService.getMetadata(file).then(
            (meta) => {
              patchState(store, { 
                videoMeta: meta, 
                status: 'idle',
                width: meta.width,
                height: meta.height
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
    updateConfig: (config: Partial<ChangeResolutionConfig>) => {
      patchState(store, config);
    },
    startProcessing: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { status: 'processing', progress: 0, outputBlob: null, errorMessage: null, errorCode: null })),
        exhaustMap(() => {
          const state = store;
          const config: ChangeResolutionConfig = {
            inputFile: state.inputFile()!,
            width: state.width(),
            height: state.height(),
            maintainAspectRatio: state.maintainAspectRatio()
          };

          const validation = ChangeResolutionInputSchema.safeParse(config);
          if (!validation.success) {
            const err = getVideoError('UNKNOWN_ERROR'); // Reusing error code
            patchState(store, { status: 'error', errorCode: err.code, errorMessage: err.message, retryable: err.retryable });
            return of(null);
          }

          return new Promise<void>((resolve) => {
            (async () => {
              try {
                const { buffer: fileBuffer } = await workerBridge.buildTransferable(config.inputFile);
                
                const workerFactory = () => new Worker(new URL('./change-resolution.worker', import.meta.url), { type: 'module' });
                
                workerBridge.process<ChangeResolutionConfig & { fileBuffer: ArrayBuffer, fileName: string }, Uint8Array>(workerFactory, {
                  inputFile: config.inputFile,
                  fileBuffer,
                  fileName: config.inputFile.name,
                  width: config.width,
                  height: config.height,
                  maintainAspectRatio: config.maintainAspectRatio
                }).subscribe({
                  next: (msg: WorkerMessage<Uint8Array>) => {
                    if (msg.type === 'progress') {
                      patchState(store, { progress: msg.value! });
                    } else if (msg.type === 'complete') {
                      const blob = new Blob([new Uint8Array(msg.data!.buffer.slice(0) as any)], { type: 'video/mp4' });
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
      a.download = `omni_res_${store.inputFile()?.name || 'video.mp4'}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 150);
    },
    resetState: () => {
      patchState(store, initialState);
    }
  }))
);
