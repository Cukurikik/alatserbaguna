import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerMessage, ExportFormat } from '../shared/types/audio.types';
import { KaraokeOutput } from './karaoke.schema';

@Injectable({ providedIn: 'root' })
export class KaraokeService {
  process(file: File, format: ExportFormat, outputTarget: KaraokeOutput, strength: number): Observable<WorkerMessage<{ blob: Blob, sizeMB: number }>> {
    return new Observable(observer => {
      let isCancelled = false;
      const worker = new Worker(new URL('./karaoke.worker', import.meta.url), { type: 'module' });
      worker.onmessage = ({ data }: MessageEvent<WorkerMessage<any>>) => {
        if (isCancelled) return;
        switch (data.type) {
          case 'progress': observer.next({ type: 'progress', value: data.value }); break;
          case 'complete': observer.next({ type: 'complete', data: data.data }); observer.complete(); worker.terminate(); break;
          case 'log': observer.next({ type: 'log', message: data.message }); break;
          case 'error': observer.error(data); worker.terminate(); break;
        }
      };
      worker.onerror = (err) => { if (!isCancelled) observer.error({ type: 'error', message: err.message, errorCode: 'WORKER_CRASHED' }); worker.terminate(); };
      worker.postMessage({ file, format, outputTarget, strength });
      return () => { isCancelled = true; worker.terminate(); };
    });
  }
}
