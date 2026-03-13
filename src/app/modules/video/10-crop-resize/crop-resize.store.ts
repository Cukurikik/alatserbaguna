import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, exhaustMap } from 'rxjs';
import { of } from 'rxjs';
import { VideoMeta, ProcessingStatus, WorkerMessage } from '../shared/types/video.types';
import { VideoErrorCode, getVideoError } from '../shared/errors/video.errors';
import { CropResizeInputSchema, CropResizeConfig } from './crop-resize.schema';
import { CropResizeService } from './crop-resize.service';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';

export interface CropResizeState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  mode: 'crop' | 'resize';
  cropRegion: { x: number; y: number; w: number; h: number };
  targetWidth: number;
  targetHeight: number;
  lockAspectRatio: boolean;
  padMode: 'stretch' | 'pad' | 'crop-to-fit';
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: CropResizeState = {
  inputFile: null,
  videoMeta: null,
  mode: 'crop',
  cropRegion: { x: 0, y: 0, w: 100, h: 100 }, // Will be updated when meta loads
  targetWidth: 1920,
  targetHeight: 1080,
  lockAspectRatio: true,
  padMode: 'pad',
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false
};

export const CropResizeStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, cropResizeService = inject(CropResizeService), workerBridge = inject(WorkerBridgeService)) => ({
    loadFile: rxMethod<{ file: File }>(
      pipe(
        tap(({ file }) => {
          patchState(store, { inputFile: file, status: 'loading', outputBlob: null, errorMessage: null, errorCode: null });
        }),
        switchMap(({ file }) => {
          return cropResizeService.getMetadata(file).then(
            (meta) => {
              patchState(store, { 
                videoMeta: meta, 
                status: 'idle',
                cropRegion: { x: 0, y: 0, w: meta.width, h: meta.height },
                targetWidth: meta.width,
                targetHeight: meta.height
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
    updateConfig: (config: Partial<CropResizeConfig>) => {
      patchState(store, config);
    },
    startProcessing: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { status: 'processing', progress: 0, outputBlob: null, errorMessage: null, errorCode: null })),
        exhaustMap(() => {
          const state = store;
          const config: CropResizeConfig = {
            inputFile: state.inputFile()!,
            mode: state.mode(),
            cropRegion: state.cropRegion(),
            targetWidth: state.targetWidth(),
            targetHeight: state.targetHeight(),
            lockAspectRatio: state.lockAspectRatio(),
            padMode: state.padMode()
          };

          const validation = CropResizeInputSchema.safeParse(config);
          if (!validation.success) {
            const err = getVideoError('INVALID_DIMENSIONS');
            patchState(store, { status: 'error', errorCode: err.code, errorMessage: err.message, retryable: err.retryable });
            return of(null);
          }

          return new Promise<void>((resolve) => {
            (async () => {
              try {
                const { buffer } = await workerBridge.buildTransferable(config.inputFile);
                const workerFactory = () => new Worker(new URL('./crop-resize.worker', import.meta.url), { type: 'module' });
                
                workerBridge.process<CropResizeConfig & { fileBuffer: ArrayBuffer, fileName: string }, Uint8Array>(workerFactory, {
                  inputFile: config.inputFile,
                  fileBuffer: buffer,
                  fileName: config.inputFile.name,
                  mode: config.mode,
                  cropRegion: config.cropRegion,
                  targetWidth: config.targetWidth,
                  targetHeight: config.targetHeight,
                  lockAspectRatio: config.lockAspectRatio,
                  padMode: config.padMode
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
      a.download = `omni_crop_resize_${store.inputFile()?.name || 'video.mp4'}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 150);
    },
    resetState: () => {
      patchState(store, initialState);
    }
  }))
);
