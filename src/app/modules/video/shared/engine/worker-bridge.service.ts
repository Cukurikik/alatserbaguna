import { Injectable } from '@angular/core';
import { Observable, timer } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WorkerMessage } from '../types/video.types';
import { getVideoError, VideoErrorCode } from '../errors/video.errors';

@Injectable({
  providedIn: 'root'
})
export class WorkerBridgeService {
  process<TConfig, TOutput>(
    workerFactory: () => Worker,
    config: TConfig
  ): Observable<WorkerMessage<TOutput>> {
    return new Observable<WorkerMessage<TOutput>>(observer => {
      let worker: Worker;
      try {
        worker = workerFactory();
      } catch {
        observer.error(getVideoError('WORKER_INIT_FAILED'));
        return;
      }

      worker.onmessage = (event: MessageEvent<WorkerMessage<TOutput>>) => {
        const msg = event.data;
        observer.next(msg);
        if (msg.type === 'complete' || msg.type === 'error') {
          worker.terminate();
          if (msg.type === 'error') {
            observer.error(getVideoError((msg.errorCode as VideoErrorCode) || 'WORKER_CRASHED'));
          } else {
            observer.complete();
          }
        }
      };

      worker.onerror = () => {
        worker.terminate();
        observer.error(getVideoError('WORKER_CRASHED'));
      };

      worker.postMessage({ type: 'start', config });

      // 15-second watchdog timer
      const timeout$ = timer(15000).pipe(
        tap(() => {
          worker.terminate();
          observer.error(getVideoError('FFMPEG_TIMEOUT'));
        })
      );

      const subscription = timeout$.subscribe();

      return () => {
        subscription.unsubscribe();
        worker.terminate();
      };
    });
  }

  async buildTransferable(file: File): Promise<{ buffer: ArrayBuffer }> {
    const buffer = await file.arrayBuffer();
    return { buffer };
  }
}
