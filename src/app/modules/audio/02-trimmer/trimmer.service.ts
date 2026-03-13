import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FfmpegService } from '../../video/shared/engine/ffmpeg.service'; // Use the shared FFmpeg from Video Phase
import { WorkerMessage } from '../shared/types/audio.types';

@Injectable({ providedIn: 'root' })
export class TrimmerService {
  private ffmpegService = inject(FfmpegService);

  trimAudio(file: File, startTimeMs: number, endTimeMs: number, format: string): Observable<WorkerMessage<{ blob: Blob, sizeMB: number }>> {
    return new Observable(observer => {
      let isCancelled = false;
      const worker = new Worker(new URL('./trimmer.worker', import.meta.url), { type: 'module' });

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

      // Send the task to worker
      worker.postMessage({
        file,
        startTimeMs,
        endTimeMs,
        format
      });

      return () => {
        isCancelled = true;
        worker.terminate();
      };
    });
  }
  
  // AudioContext based waveform extraction
  async extractWaveformData(file: File, cachePoints: number = 200): Promise<{ peaks: number[], durationMs: number }> {
    const ctx = new AudioContext({ sampleRate: 8000 }); // Low sample rate just for waveform
    const buffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(buffer);
    
    const channelData = audioBuffer.getChannelData(0); // Take left channel
    const step = Math.ceil(channelData.length / cachePoints);
    const peaks = [];
    
    for (let i = 0; i < cachePoints; i++) {
      let min = 1.0;
      let max = -1.0;
      const start = i * step;
      const end = Math.min(start + step, channelData.length);
      
      for (let j = start; j < end; j++) {
        const val = channelData[j];
        if (val < min) min = val;
        if (val > max) max = val;
      }
      peaks.push(Math.max(Math.abs(min), Math.abs(max)));
    }
    
    ctx.close();
    return {
      peaks,
      durationMs: audioBuffer.duration * 1000
    };
  }
}
