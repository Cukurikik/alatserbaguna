import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage, VideoMeta } from '../shared/types/video.types';

export type InterpolatorAlgorithm = 'duplicate' | 'motion';

export interface InterpolatorConfig {
  file: File;
  targetFPS: '24' | '30' | '60' | '120';
  algorithm: InterpolatorAlgorithm;
  videoMeta: VideoMeta;
}

@Injectable({ providedIn: 'root' })
export class InterpolatorService {
  private bridge = inject(WorkerBridgeService);

  /**
   * Fluid Engine processor.
   */
  process(config: InterpolatorConfig): Observable<WorkerMessage<ArrayBuffer>> {
    const worker = new Worker(new URL('./interpolator.worker', import.meta.url), { type: 'module' });
    return this.bridge.runTask(worker, config);
  }

  getOutputFilename(originalName: string, targetFPS: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_fluid_${targetFPS}fps_${base}.mp4`;
  }
}