import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, exhaustMap } from 'rxjs';
import { of } from 'rxjs';
import { VideoMeta, ProcessingStatus, WorkerMessage } from '../shared/types/video.types';
import { VideoErrorCode, getVideoError } from '../shared/errors/video.errors';
import { MergerInputSchema, MergerConfig } from './merger.schema';
import { MergerService } from './merger.service';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';

export interface MergerState {
  inputFiles: File[];
  videoMetas: VideoMeta[];
  resolution: '1080p' | '720p' | 'original';
  transition: 'none' | 'fade';
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: MergerState = {
  inputFiles: [],
  videoMetas: [],
  resolution: 'original',
  transition: 'none',
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false
};

export const MergerStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, mergerService = inject(MergerService), workerBridge = inject(WorkerBridgeService)) => ({
    loadFiles: rxMethod<{ files: File[] }>(
      pipe(
        tap(({ files }) => {
          patchState(store, { inputFiles: files, status: 'loading', outputBlob: null, errorMessage: null, errorCode: null });
        }),
        switchMap(({ files }) => {
          const promises = files.map(file => mergerService.getMetadata(file));
          return Promise.all(promises).then(
            (metas) => {
              patchState(store, { 
                videoMetas: metas, 
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
    updateConfig: (config: Partial<MergerConfig>) => {
      patchState(store, config);
    },
    startProcessing: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { status: 'processing', progress: 0, outputBlob: null, errorMessage: null, errorCode: null })),
        exhaustMap(() => {
          const state = store;
          const config: MergerConfig = {
            inputFiles: state.inputFiles(),
            resolution: state.resolution(),
            transition: state.transition()
          };

          const validation = MergerInputSchema.safeParse(config);
          if (!validation.success) {
            const err = getVideoError('UNKNOWN_ERROR'); // Reusing error code
            patchState(store, { status: 'error', errorCode: err.code, errorMessage: err.message, retryable: err.retryable });
            return of(null);
          }

          return new Promise<void>((resolve) => {
            (async () => {
              try {
                const filesData = await Promise.all(config.inputFiles.map(async (file, index) => {
                  const { buffer } = await workerBridge.buildTransferable(file);
                  return { buffer, name: `input_${index}_${file.name}` };
                }));
                
                const workerFactory = () => new Worker(new URL('./merger.worker', import.meta.url), { type: 'module' });
                
                workerBridge.process<{ inputFiles: File[], files: { buffer: ArrayBuffer, name: string }[], resolution: string, transition: string }, Uint8Array>(workerFactory, {
                  inputFiles: config.inputFiles,
                  files: filesData,
                  resolution: config.resolution,
                  transition: config.transition
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
      a.download = `omni_merged.mp4`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 150);
    },
    resetState: () => {
      patchState(store, initialState);
    }
  }))
);
