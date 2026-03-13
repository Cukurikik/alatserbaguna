import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, exhaustMap } from 'rxjs';
import { of } from 'rxjs';
import { VideoMeta, ProcessingStatus, WorkerMessage } from '../shared/types/video.types';
import { VideoErrorCode, getVideoError } from '../shared/errors/video.errors';
import { ToAudioInputSchema, ToAudioConfig } from './to-audio.schema';
import { ToAudioService } from './to-audio.service';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';

export interface ToAudioState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  format: 'mp3' | 'wav' | 'aac' | 'ogg' | 'flac';
  quality: 'low' | 'medium' | 'high';
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: ToAudioState = {
  inputFile: null,
  videoMeta: null,
  format: 'mp3',
  quality: 'high',
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false
};

export const ToAudioStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, toAudioService = inject(ToAudioService), workerBridge = inject(WorkerBridgeService)) => ({
    loadFile: rxMethod<{ file: File }>(
      pipe(
        tap(({ file }) => {
          patchState(store, { inputFile: file, status: 'loading', outputBlob: null, errorMessage: null, errorCode: null });
        }),
        switchMap(({ file }) => {
          return toAudioService.getMetadata(file).then(
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
    updateConfig: (config: Partial<ToAudioConfig>) => {
      patchState(store, config);
    },
    startProcessing: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { status: 'processing', progress: 0, outputBlob: null, errorMessage: null, errorCode: null })),
        exhaustMap(() => {
          const state = store;
          const config: ToAudioConfig = {
            inputFile: state.inputFile()!,
            format: state.format(),
            quality: state.quality()
          };

          const validation = ToAudioInputSchema.safeParse(config);
          if (!validation.success) {
            const err = getVideoError('UNKNOWN_ERROR'); // Reusing error code
            patchState(store, { status: 'error', errorCode: err.code, errorMessage: err.message, retryable: err.retryable });
            return of(null);
          }

          return new Promise<void>((resolve) => {
            (async () => {
              try {
                const { buffer: fileBuffer } = await workerBridge.buildTransferable(config.inputFile);
                
                const workerFactory = () => new Worker(new URL('./to-audio.worker', import.meta.url), { type: 'module' });
                
                workerBridge.process<ToAudioConfig & { fileBuffer: ArrayBuffer, fileName: string }, Uint8Array>(workerFactory, {
                  inputFile: config.inputFile,
                  fileBuffer,
                  fileName: config.inputFile.name,
                  format: config.format,
                  quality: config.quality
                }).subscribe({
                  next: (msg: WorkerMessage<Uint8Array>) => {
                    if (msg.type === 'progress') {
                      patchState(store, { progress: msg.value! });
                    } else if (msg.type === 'complete') {
                      const mimeType = config.format === 'mp3' ? 'audio/mpeg' : 
                                       config.format === 'wav' ? 'audio/wav' : 
                                       config.format === 'aac' ? 'audio/aac' : 
                                       config.format === 'ogg' ? 'audio/ogg' : 'audio/flac';
                      const blob = new Blob([new Uint8Array(msg.data!.buffer.slice(0) as unknown as ArrayBuffer)], { type: mimeType });
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
      a.download = `omni_audio_${store.inputFile()?.name.split('.')[0] || 'video'}.${store.format()}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 150);
    },
    resetState: () => {
      patchState(store, initialState);
    }
  }))
);
