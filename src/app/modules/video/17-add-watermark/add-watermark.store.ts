import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, exhaustMap } from 'rxjs';
import { of } from 'rxjs';
import { VideoMeta, ProcessingStatus, WorkerMessage } from '../shared/types/video.types';
import { VideoErrorCode, getVideoError } from '../shared/errors/video.errors';
import { AddWatermarkInputSchema, AddWatermarkConfig } from './add-watermark.schema';
import { AddWatermarkService } from './add-watermark.service';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';

export interface AddWatermarkState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  watermarkFile: File | null;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
  scale: number;
  padding: number;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: AddWatermarkState = {
  inputFile: null,
  videoMeta: null,
  watermarkFile: null,
  position: 'bottom-right',
  opacity: 80,
  scale: 15,
  padding: 20,
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false
};

export const AddWatermarkStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, addWatermarkService = inject(AddWatermarkService), workerBridge = inject(WorkerBridgeService)) => ({
    loadFile: rxMethod<{ file: File }>(
      pipe(
        tap(({ file }) => {
          patchState(store, { inputFile: file, status: 'loading', outputBlob: null, errorMessage: null, errorCode: null });
        }),
        switchMap(({ file }) => {
          return addWatermarkService.getMetadata(file).then(
            (meta) => {
              patchState(store, { 
                videoMeta: meta, 
                status: 'idle'
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
    loadWatermarkFile: (file: File) => {
      patchState(store, { watermarkFile: file });
    },
    updateConfig: (config: Partial<AddWatermarkConfig>) => {
      patchState(store, config);
    },
    startProcessing: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { status: 'processing', progress: 0, outputBlob: null, errorMessage: null, errorCode: null })),
        exhaustMap(() => {
          const state = store;
          const config: AddWatermarkConfig = {
            inputFile: state.inputFile()!,
            watermarkFile: state.watermarkFile()!,
            position: state.position(),
            opacity: state.opacity(),
            scale: state.scale(),
            padding: state.padding()
          };

          const validation = AddWatermarkInputSchema.safeParse(config);
          if (!validation.success) {
            const err = getVideoError('UNKNOWN_ERROR'); // Reusing error code
            patchState(store, { status: 'error', errorCode: err.code, errorMessage: err.message, retryable: err.retryable });
            return of(null);
          }

          return new Promise<void>((resolve) => {
            (async () => {
              try {
                const { buffer: fileBuffer } = await workerBridge.buildTransferable(config.inputFile);
                const { buffer: watermarkBuffer } = await workerBridge.buildTransferable(config.watermarkFile);
                
                const workerFactory = () => new Worker(new URL('./add-watermark.worker', import.meta.url), { type: 'module' });
                
                workerBridge.process<AddWatermarkConfig & { fileBuffer: ArrayBuffer, fileName: string, watermarkBuffer: ArrayBuffer, watermarkFileName: string }, Uint8Array>(workerFactory, {
                  inputFile: config.inputFile,
                  watermarkFile: config.watermarkFile,
                  fileBuffer,
                  fileName: config.inputFile.name,
                  watermarkBuffer,
                  watermarkFileName: config.watermarkFile.name,
                  position: config.position,
                  opacity: config.opacity,
                  scale: config.scale,
                  padding: config.padding
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
      a.download = `omni_watermarked_${store.inputFile()?.name || 'video.mp4'}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 150);
    },
    resetState: () => {
      patchState(store, initialState);
    }
  }))
);
