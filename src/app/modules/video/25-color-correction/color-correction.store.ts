import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, exhaustMap } from 'rxjs';
import { of } from 'rxjs';
import { VideoMeta, ProcessingStatus, WorkerMessage } from '../shared/types/video.types';
import { VideoErrorCode, getVideoError } from '../shared/errors/video.errors';
import { ColorCorrectionInputSchema, ColorCorrectionConfig } from './color-correction.schema';
import { ColorCorrectionService } from './color-correction.service';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';

export interface ColorCorrectionState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  brightness: number;
  contrast: number;
  saturation: number;
  gamma: number;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: ColorCorrectionState = {
  inputFile: null,
  videoMeta: null,
  brightness: 0,
  contrast: 1,
  saturation: 1,
  gamma: 1,
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false
};

export const ColorCorrectionStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, colorCorrectionService = inject(ColorCorrectionService), workerBridge = inject(WorkerBridgeService)) => ({
    loadFile: rxMethod<{ file: File }>(
      pipe(
        tap(({ file }) => {
          patchState(store, { inputFile: file, status: 'loading', outputBlob: null, errorMessage: null, errorCode: null });
        }),
        switchMap(({ file }) => {
          return colorCorrectionService.getMetadata(file).then(
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
    updateConfig: (config: Partial<ColorCorrectionConfig>) => {
      patchState(store, config);
    },
    startProcessing: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { status: 'processing', progress: 0, outputBlob: null, errorMessage: null, errorCode: null })),
        exhaustMap(() => {
          const state = store;
          const config: ColorCorrectionConfig = {
            inputFile: state.inputFile()!,
            brightness: state.brightness(),
            contrast: state.contrast(),
            saturation: state.saturation(),
            gamma: state.gamma()
          };

          const validation = ColorCorrectionInputSchema.safeParse(config);
          if (!validation.success) {
            const err = getVideoError('UNKNOWN_ERROR'); // Reusing error code
            patchState(store, { status: 'error', errorCode: err.code, errorMessage: err.message, retryable: err.retryable });
            return of(null);
          }

  // eslint-disable-next-line no-async-promise-executor
          return new Promise<void>(async (resolve) => {
            try {
              const { buffer: fileBuffer } = await workerBridge.buildTransferable(config.inputFile);
              
              const workerFactory = () => new Worker(new URL('./color-correction.worker', import.meta.url), { type: 'module' });
              
              workerBridge.process<ColorCorrectionConfig & { fileBuffer: ArrayBuffer, fileName: string }, Uint8Array>(workerFactory, {
                inputFile: config.inputFile,
                fileBuffer,
                fileName: config.inputFile.name,
                brightness: config.brightness,
                contrast: config.contrast,
                saturation: config.saturation,
                gamma: config.gamma
              }).subscribe({
                next: (msg: WorkerMessage<Uint8Array>) => {
                  if (msg.type === 'progress') {
                    patchState(store, { progress: msg.value! });
                  } else if (msg.type === 'complete') {
                    const blob = new Blob([new Uint8Array(msg.data!.buffer.slice(0) as unknown as ArrayBuffer)], { type: 'video/mp4' });
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
      a.download = `omni_color_${store.inputFile()?.name || 'video.mp4'}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 150);
    },
    resetState: () => {
      patchState(store, initialState);
    }
  }))
);
