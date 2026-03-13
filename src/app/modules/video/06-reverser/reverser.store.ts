import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, exhaustMap } from 'rxjs';
import { of } from 'rxjs';
import { VideoMeta, ProcessingStatus, WorkerMessage } from '../shared/types/video.types';
import { VideoErrorCode, getVideoError } from '../shared/errors/video.errors';
import { ReverserInputSchema, ReverserConfig } from './reverser.schema';
import { FFmpegService } from '../shared/engine/ffmpeg.service';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';

export interface ReverserState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  reverseAudio: boolean;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
  durationWarning: boolean;
}

const initialState: ReverserState = {
  inputFile: null,
  videoMeta: null,
  reverseAudio: false,
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false,
  durationWarning: false
};

export const ReverserStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, ffmpegService = inject(FFmpegService), workerBridge = inject(WorkerBridgeService)) => ({
    loadFile: rxMethod<{ file: File }>(
      pipe(
        tap(({ file }) => {
          patchState(store, { inputFile: file, status: 'loading', outputBlob: null, errorMessage: null, errorCode: null });
        }),
        switchMap(({ file }) => {
          return ffmpegService.getMetadata(file).then(
            (meta) => {
              patchState(store, { videoMeta: meta, status: 'idle', durationWarning: meta.duration > 120 });
            },
            () => {
              const err = getVideoError('FILE_CORRUPTED');
              patchState(store, { status: 'error', errorCode: err.code, errorMessage: err.message, retryable: err.retryable });
            }
          );
        })
      )
    ),
    updateConfig: (config: Partial<ReverserConfig>) => {
      patchState(store, config);
    },
    startProcessing: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { status: 'processing', progress: 0, outputBlob: null, errorMessage: null, errorCode: null })),
        exhaustMap(() => {
          const state = store;
          const config: ReverserConfig = {
            inputFile: state.inputFile()!,
            reverseAudio: state.reverseAudio()
          };

          const validation = ReverserInputSchema.safeParse(config);
          if (!validation.success) {
            const err = getVideoError('INVALID_FILE_TYPE');
            patchState(store, { status: 'error', errorCode: err.code, errorMessage: err.message, retryable: err.retryable });
            return of(null);
          }

          return new Promise<void>((resolve) => {
            (async () => {
              try {
                const { buffer } = await workerBridge.buildTransferable(config.inputFile);
                const workerFactory = () => new Worker(new URL('./reverser.worker', import.meta.url), { type: 'module' });
                
                workerBridge.process<ReverserConfig & { fileBuffer: ArrayBuffer, fileName: string, duration: number }, Uint8Array>(workerFactory, {
                  inputFile: config.inputFile,
                  fileBuffer: buffer,
                  fileName: config.inputFile.name,
                  reverseAudio: config.reverseAudio,
                  duration: state.videoMeta()!.duration
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
      a.download = `omni_reversed_${store.inputFile()?.name || 'video.mp4'}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 150);
    },
    resetState: () => {
      const blob = store.outputBlob();
      if (blob) {
        // revoke object url if any
      }
      patchState(store, initialState);
    }
  }))
);
