import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, exhaustMap } from 'rxjs';
import { of } from 'rxjs';
import { VideoMeta, ProcessingStatus, WorkerMessage } from '../shared/types/video.types';
import { VideoErrorCode, getVideoError } from '../shared/errors/video.errors';
import { VideoToDashInputSchema, VideoToDashConfig } from './video-to-dash.schema';
import { VideoToDashService } from './video-to-dash.service';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';

export interface VideoToDashState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  segmentDuration: number;
  preset: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow';
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: VideoToDashState = {
  inputFile: null,
  videoMeta: null,
  segmentDuration: 10,
  preset: 'fast',
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false
};

export const VideoToDashStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, videoToDashService = inject(VideoToDashService), workerBridge = inject(WorkerBridgeService)) => ({
    loadFile: rxMethod<{ file: File }>(
      pipe(
        tap(({ file }) => {
          patchState(store, { inputFile: file, status: 'loading', outputBlob: null, errorMessage: null, errorCode: null });
        }),
        switchMap(({ file }) => {
          return videoToDashService.getMetadata(file).then(
            (meta) => {
              patchState(store, { 
                videoMeta: meta, 
                status: 'idle'
              });
            },
            (error) => {
              const err = getVideoError('FILE_CORRUPTED');
              patchState(store, { status: 'error', errorCode: err.code, errorMessage: err.message, retryable: err.retryable });
            }
          );
        })
      )
    ),
    updateConfig: (config: Partial<VideoToDashConfig>) => {
      patchState(store, config);
    },
    startProcessing: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { status: 'processing', progress: 0, outputBlob: null, errorMessage: null, errorCode: null })),
        exhaustMap(() => {
          const state = store;
          const config: VideoToDashConfig = {
            inputFile: state.inputFile()!,
            segmentDuration: state.segmentDuration(),
            preset: state.preset()
          };

          const validation = VideoToDashInputSchema.safeParse(config);
          if (!validation.success) {
            const err = getVideoError('UNKNOWN_ERROR'); // Reusing error code
            patchState(store, { status: 'error', errorCode: err.code, errorMessage: err.message, retryable: err.retryable });
            return of(null);
          }

          return new Promise<void>(async (resolve) => {
            try {
              const { buffer: fileBuffer } = await workerBridge.buildTransferable(config.inputFile);
              
              const workerFactory = () => new Worker(new URL('./video-to-dash.worker', import.meta.url), { type: 'module' });
              
              workerBridge.process<VideoToDashConfig & { fileBuffer: ArrayBuffer, fileName: string }, Uint8Array>(workerFactory, {
                inputFile: config.inputFile,
                fileBuffer,
                fileName: config.inputFile.name,
                segmentDuration: config.segmentDuration,
                preset: config.preset
              }).subscribe({
                next: (msg: WorkerMessage<Uint8Array>) => {
                  if (msg.type === 'progress') {
                    patchState(store, { progress: msg.value! });
                  } else if (msg.type === 'complete') {
                    const blob = new Blob([new Uint8Array(msg.data!.buffer.slice(0) as any)], { type: 'application/zip' });
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
            } catch (e) {
              const videoErr = getVideoError('WORKER_INIT_FAILED');
              patchState(store, { status: 'error', errorCode: videoErr.code, errorMessage: videoErr.message, retryable: videoErr.retryable });
              resolve();
            }
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
      a.download = `omni_dash_${store.inputFile()?.name || 'video'}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 150);
    },
    resetState: () => {
      patchState(store, initialState);
    }
  }))
);
