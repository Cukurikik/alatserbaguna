import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, exhaustMap } from 'rxjs';
import { of } from 'rxjs';
import { VideoMeta, ProcessingStatus, WorkerMessage } from '../shared/types/video.types';
import { VideoErrorCode, getVideoError } from '../shared/errors/video.errors';
import { AddAudioInputSchema, AddAudioConfig } from './add-audio.schema';
import { AddAudioService } from './add-audio.service';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';

export interface AddAudioState {
  inputFile: File | null;
  videoMeta: VideoMeta | null;
  audioFile: File | null;
  mode: 'replace' | 'mix';
  videoVolume: number;
  audioVolume: number;
  loopAudio: boolean;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: AddAudioState = {
  inputFile: null,
  videoMeta: null,
  audioFile: null,
  mode: 'replace',
  videoVolume: 1,
  audioVolume: 1,
  loopAudio: false,
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false
};

export const AddAudioStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, addAudioService = inject(AddAudioService), workerBridge = inject(WorkerBridgeService)) => ({
    loadFile: rxMethod<{ file: File }>(
      pipe(
        tap(({ file }) => {
          patchState(store, { inputFile: file, status: 'loading', outputBlob: null, errorMessage: null, errorCode: null });
        }),
        switchMap(({ file }) => {
          return addAudioService.getMetadata(file).then(
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
    loadAudioFile: (file: File) => {
      patchState(store, { audioFile: file });
    },
    updateConfig: (config: Partial<AddAudioConfig>) => {
      patchState(store, config);
    },
    startProcessing: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { status: 'processing', progress: 0, outputBlob: null, errorMessage: null, errorCode: null })),
        exhaustMap(() => {
          const state = store;
          const config: AddAudioConfig = {
            inputFile: state.inputFile()!,
            audioFile: state.audioFile()!,
            mode: state.mode(),
            videoVolume: state.videoVolume(),
            audioVolume: state.audioVolume(),
            loopAudio: state.loopAudio()
          };

          const validation = AddAudioInputSchema.safeParse(config);
          if (!validation.success) {
            const err = getVideoError('UNKNOWN_ERROR'); // Reusing error code
            patchState(store, { status: 'error', errorCode: err.code, errorMessage: err.message, retryable: err.retryable });
            return of(null);
          }

          return new Promise<void>((resolve) => {
            (async () => {
              try {
                const { buffer: fileBuffer } = await workerBridge.buildTransferable(config.inputFile);
                const { buffer: audioBuffer } = await workerBridge.buildTransferable(config.audioFile);
                
                const workerFactory = () => new Worker(new URL('./add-audio.worker', import.meta.url), { type: 'module' });
                
                workerBridge.process<AddAudioConfig & { fileBuffer: ArrayBuffer, fileName: string, audioBuffer: ArrayBuffer, audioFileName: string }, Uint8Array>(workerFactory, {
                  inputFile: config.inputFile,
                  audioFile: config.audioFile,
                  fileBuffer,
                  fileName: config.inputFile.name,
                  audioBuffer,
                  audioFileName: config.audioFile.name,
                  mode: config.mode,
                  videoVolume: config.videoVolume,
                  audioVolume: config.audioVolume,
                  loopAudio: config.loopAudio
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
      a.download = `omni_audio_added_${store.inputFile()?.name || 'video.mp4'}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 150);
    },
    resetState: () => {
      patchState(store, initialState);
    }
  }))
);
