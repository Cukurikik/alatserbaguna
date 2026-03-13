import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerMessage } from '../types/audio.types';

@Injectable({ providedIn: 'root' })
export class WorkerBridgeService {
  process<TInput, TOutput>(
    workerFactory: () => Worker,
    data: TInput
  ): Observable<WorkerMessage<TOutput>> {
    return new Observable(obs => {
      const worker = workerFactory();
      worker.onmessage = (e: MessageEvent<WorkerMessage<TOutput>>) => {
        obs.next(e.data);
        if (e.data.type === 'complete' || e.data.type === 'error') {
          obs.complete();
        }
      };
      worker.onerror = (err) => {
        obs.next({ type: 'error', message: err.message, errorCode: 'WORKER_CRASHED' });
        obs.complete();
      };
      worker.postMessage(data);
      return () => worker.terminate();
    });
  }
}
