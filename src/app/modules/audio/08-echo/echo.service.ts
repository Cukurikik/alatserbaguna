import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FfmpegService } from '../../video/shared/engine/ffmpeg.service'; 
import { WorkerMessage, ExportFormat } from '../shared/types/audio.types';

@Injectable({ providedIn: 'root' })
export class EchoService {
  private ffmpegService = inject(FfmpegService);

  applyEcho(
    file: File, 
    format: ExportFormat, 
    delayMs: number,
    feedback: number,
    dryMix: number,
    wetMix: number
  ): Observable<WorkerMessage<{ blob: Blob, sizeMB: number }>> {
    return new Observable(observer => {
      let isCancelled = false;
      const worker = new Worker(new URL('./echo.worker', import.meta.url), { type: 'module' });

      worker.onmessage = ({ data }: MessageEvent<WorkerMessage<any>>) => {
        if (isCancelled) return;
        
        switch (data.type) {
          case 'progress':
            observer.next({ type: 'progress', value: data.value });
            break;
          case 'complete':
            observer.next({ type: 'complete', data: data.data });
            observer.complete();
            worker.terminate();
            break;
          case 'log':
             observer.next({ type: 'log', message: data.message });
             break;
          case 'error':
            observer.error(data);
            worker.terminate();
            break;
        }
      };

      worker.onerror = (err) => {
        if (isCancelled) return;
        observer.error({ type: 'error', message: err.message, errorCode: 'WORKER_CRASHED' });
        worker.terminate();
      };

      worker.postMessage({
        file,
        format,
        delayMs,
        feedback,
        dryMix,
        wetMix
      });

      return () => {
        isCancelled = true;
        worker.terminate();
      };
    });
  }
}
