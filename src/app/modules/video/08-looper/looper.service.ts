import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { VideoMeta, WorkerMessage } from '../shared/types/video.types';

export interface LooperConfig {
  file: File;
  mode: 'count' | 'duration';
  loopCount?: number;
  targetDuration?: number;
  crossfade: boolean;
  crossfadeDuration: number;
  videoMeta: VideoMeta;
}

@Injectable({ providedIn: 'root' })
export class LooperService {
  private bridge = inject(WorkerBridgeService);

  /**
   * Build the FFmpeg concat command parameters.
   */
  process(config: LooperConfig): Observable<WorkerMessage<ArrayBuffer>> {
    const worker = new Worker(new URL('./looper.worker', import.meta.url), { type: 'module' });
    return this.bridge.runTask(worker, config);
  }

  /**
   * Calculate output duration based on loops.
   */
  getPredictedDuration(config: LooperConfig): number {
    const clipDur = config.videoMeta.duration;
    if (config.mode === 'count' && config.loopCount) {
      if (config.crossfade) {
        return (clipDur * config.loopCount) - (config.crossfadeDuration * (config.loopCount - 1));
      }
      return clipDur * config.loopCount;
    }
    return config.targetDuration || clipDur;
  }

  getOutputFilename(originalName: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_loop_${base}.mp4`;
  }
}