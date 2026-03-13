import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, exhaustMap } from 'rxjs';
import { of } from 'rxjs';
import { VideoMeta, ProcessingStatus, WorkerMessage } from '../shared/types/video.types';
import { VideoErrorCode, getVideoError } from '../shared/errors/video.errors';
import { VideoThumbnailInputSchema, VideoThumbnailConfig } from './video-thumbnail.schema';
import { VideoThumbnailService } from './video-thumbnail.service';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';

export interface VideoThumbnailState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  timestamp: number;
  format: 'jpeg' | 'png' | 'webp';
  quality: number;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: VideoThumbnailState = {
  inputFile: null,
  videoMeta: null,
  timestamp: 0,
  format: 'jpeg',
  quality: 2,
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false
};

export const VideoThumbnailStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, videoThumbnailService = inject(VideoThumbnailService), workerBridge = inject(WorkerBridgeService)) => ({
    loadFile: rxMethod<{ file: File }>(
      pipe(
        tap(({ file }) => {
          patchState(store, { inputFile: file, status: 'loading', outputBlob: null, errorMessage: null, errorCode: null });
        }),
        switchMap(({ file }) => {
          return videoThumbnailService.getMetadata(file).then(
            (meta) => {
              patchState(store, { 
                videoMeta: meta, 
                status: 'idle',
                timestamp: Math.min(1, meta.duration / 2) // Default to 1s or middle if very short
              });
            }
          ).catch(() => {
            const err = getVideoError('FILE_CORRUPTED');
            patchState(store, { status: 'error', errorCode: err.code, errorMessage: err.message, retryable: err.retryable });
          });
        })
      )
    ),
    updateConfig: (config: Partial<VideoThumbnailConfig>) => {
      patchState(store, config);
    },
    startProcessing: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { status: 'processing', progress: 0, outputBlob: null, errorMessage: null, errorCode: null })),
        exhaustMap(() => {
          const state = store;
          const config: VideoThumbnailConfig = {
            inputFile: state.inputFile()!,
            timestamp: state.timestamp(),
            format: state.format(),
            quality: state.quality()
          };

          const validation = VideoThumbnailInputSchema.safeParse(config);
          if (!validation.success) {
            const err = getVideoError('UNKNOWN_ERROR');
            patchState(store, { status: 'error', errorCode: err.code, errorMessage: err.message, retryable: err.retryable });
            return of(null);
          }

          return new Promise<void>((resolve) => {
            (async () => {
              try {
                const { buffer: fileBuffer } = await workerBridge.buildTransferable(config.inputFile);
                
                const workerFactory = () => new Worker(new URL('./video-thumbnail.worker', import.meta.url), { type: 'module' });
                
                workerBridge.process<Record<string, unknown>, Uint8Array>(workerFactory, {
                  inputFile: config.inputFile,
                  fileBuffer,
                  fileName: config.inputFile.name,
                  timestamp: config.timestamp,
                  format: config.format,
                  quality: config.quality
                }).subscribe({
                  next: (msg: WorkerMessage<Uint8Array>) => {
                    if (msg.type === 'progress') {
                      patchState(store, { progress: msg.value! });
                    } else if (msg.type === 'complete') {
                      const mimeTypes: Record<string, string> = {
                        'jpeg': 'image/jpeg',
                        'png': 'image/png',
                        'webp': 'image/webp'
                      };
                      const buffer = msg.data!.buffer;
                      const arrayBuffer = buffer instanceof SharedArrayBuffer ? buffer.slice(0) : buffer;
                      const blob = new Blob([new Uint8Array(arrayBuffer as any)], { type: mimeTypes[config.format] });
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
      const originalName = store.inputFile()?.name || 'video';
      const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
      a.download = `thumbnail_${baseName}_${store.timestamp().toFixed(2)}s.${store.format()}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 150);
    },
    resetState: () => {
      patchState(store, initialState);
    }
  }))
);
