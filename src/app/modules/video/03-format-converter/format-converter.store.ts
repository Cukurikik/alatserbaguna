import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, exhaustMap } from 'rxjs';
import { of } from 'rxjs';
import { VideoMeta, ProcessingStatus, WorkerMessage } from '../shared/types/video.types';
import { VideoErrorCode, getVideoError } from '../shared/errors/video.errors';
import { FormatConverterInputSchema, FormatConverterConfig } from './format-converter.schema';
import { FormatConverterService } from './format-converter.service';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';

export interface FormatConverterState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  format: 'mp4' | 'webm' | 'mov' | 'avi' | 'mkv' | 'flv' | 'wmv';
  preset: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow';
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: FormatConverterState = {
  inputFile: null,
  videoMeta: null,
  format: 'mp4',
  preset: 'fast',
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false
};

export const FormatConverterStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, formatConverterService = inject(FormatConverterService), workerBridge = inject(WorkerBridgeService)) => ({
    loadFile: rxMethod<{ file: File }>(
      pipe(
        tap(({ file }) => {
          patchState(store, { inputFile: file, status: 'loading', outputBlob: null, errorMessage: null, errorCode: null });
        }),
        switchMap(({ file }) => {
          return formatConverterService.getMetadata(file).then(
            (meta) => {
              patchState(store, { 
                videoMeta: meta, 
                status: 'idle'
              });
            }
          ).catch(() => {
            const err = getVideoError('FILE_CORRUPTED');
            patchState(store, { status: 'error', errorCode: err.code, errorMessage: err.message, retryable: err.retryable });
          });
        })
      )
    ),
    updateConfig: (config: Partial<FormatConverterConfig>) => {
      patchState(store, config);
    },
    startProcessing: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { status: 'processing', progress: 0, outputBlob: null, errorMessage: null, errorCode: null })),
        exhaustMap(() => {
          const state = store;
          const config: FormatConverterConfig = {
            inputFile: state.inputFile()!,
            format: state.format(),
            preset: state.preset()
          };

          const validation = FormatConverterInputSchema.safeParse(config);
          if (!validation.success) {
            const err = getVideoError('UNKNOWN_ERROR'); // Reusing error code
            patchState(store, { status: 'error', errorCode: err.code, errorMessage: err.message, retryable: err.retryable });
            return of(null);
          }

          return new Promise<void>((resolve) => {
            (async () => {
              try {
                const { buffer: fileBuffer } = await workerBridge.buildTransferable(config.inputFile);
                
                const workerFactory = () => new Worker(new URL('./format-converter.worker', import.meta.url), { type: 'module' });
                
                workerBridge.process<Record<string, unknown>, Uint8Array>(workerFactory, {
                  inputFile: config.inputFile,
                  fileBuffer,
                  fileName: config.inputFile.name,
                  format: config.format,
                  preset: config.preset
                }).subscribe({
                  next: (msg: WorkerMessage<Uint8Array>) => {
                    if (msg.type === 'progress') {
                      patchState(store, { progress: msg.value! });
                    } else if (msg.type === 'complete') {
                      const mimeTypes: Record<string, string> = {
                        'mp4': 'video/mp4',
                        'webm': 'video/webm',
                        'mov': 'video/quicktime',
                        'avi': 'video/x-msvideo',
                        'mkv': 'video/x-matroska',
                        'flv': 'video/x-flv',
                        'wmv': 'video/x-ms-wmv'
                      };
                      const buffer = msg.data!.buffer;
                      const arrayBuffer = buffer instanceof SharedArrayBuffer ? buffer.slice(0) : buffer;
                      const blob = new Blob([new Uint8Array(arrayBuffer as unknown as ArrayBuffer)], { type: mimeTypes[config.format] || 'video/mp4' });
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
      a.download = `omni_${baseName}.${store.format()}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 150);
    },
    resetState: () => {
      patchState(store, initialState);
    }
  }))
);
