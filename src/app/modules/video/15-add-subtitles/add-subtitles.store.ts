import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, exhaustMap } from 'rxjs';
import { of } from 'rxjs';
import { VideoMeta, ProcessingStatus, WorkerMessage } from '../shared/types/video.types';
import { VideoErrorCode, getVideoError } from '../shared/errors/video.errors';
import { AddSubtitlesInputSchema, AddSubtitlesConfig } from './add-subtitles.schema';
import { AddSubtitlesService } from './add-subtitles.service';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';

export interface AddSubtitlesState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  subtitleFile: File | null;
  mode: 'hard' | 'soft';
  language: string;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: AddSubtitlesState = {
  inputFile: null,
  videoMeta: null,
  subtitleFile: null,
  mode: 'hard',
  language: 'eng',
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false
};

export const AddSubtitlesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, addSubtitlesService = inject(AddSubtitlesService), workerBridge = inject(WorkerBridgeService)) => ({
    loadFile: rxMethod<{ file: File }>(
      pipe(
        tap(({ file }) => {
          patchState(store, { inputFile: file, status: 'loading', outputBlob: null, errorMessage: null, errorCode: null });
        }),
        switchMap(({ file }) => {
          return addSubtitlesService.getMetadata(file).then(
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
    loadSubtitleFile: (file: File) => {
      patchState(store, { subtitleFile: file });
    },
    updateConfig: (config: Partial<AddSubtitlesConfig>) => {
      patchState(store, config);
    },
    startProcessing: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { status: 'processing', progress: 0, outputBlob: null, errorMessage: null, errorCode: null })),
        exhaustMap(() => {
          const state = store;
          const config: AddSubtitlesConfig = {
            inputFile: state.inputFile()!,
            subtitleFile: state.subtitleFile()!,
            mode: state.mode(),
            language: state.language()
          };

          const validation = AddSubtitlesInputSchema.safeParse(config);
          if (!validation.success) {
            const err = getVideoError('UNKNOWN_ERROR'); // Reusing error code
            patchState(store, { status: 'error', errorCode: err.code, errorMessage: err.message, retryable: err.retryable });
            return of(null);
          }

          return new Promise<void>((resolve) => {
            (async () => {
              try {
                const { buffer: fileBuffer } = await workerBridge.buildTransferable(config.inputFile);
                const { buffer: subtitleBuffer } = await workerBridge.buildTransferable(config.subtitleFile);
                
                const workerFactory = () => new Worker(new URL('./add-subtitles.worker', import.meta.url), { type: 'module' });
                
                workerBridge.process<AddSubtitlesConfig & { fileBuffer: ArrayBuffer, fileName: string, subtitleBuffer: ArrayBuffer, subtitleFileName: string }, Uint8Array>(workerFactory, {
                  inputFile: config.inputFile,
                  subtitleFile: config.subtitleFile,
                  fileBuffer,
                  fileName: config.inputFile.name,
                  subtitleBuffer,
                  subtitleFileName: config.subtitleFile.name,
                  mode: config.mode,
                  language: config.language
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
      a.download = `omni_subbed_${store.inputFile()?.name || 'video.mp4'}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 150);
    },
    resetState: () => {
      patchState(store, initialState);
    }
  }))
);
