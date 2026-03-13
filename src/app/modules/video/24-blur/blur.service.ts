import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage } from '../shared/types/video.types';

export interface BlurRegion { x: number; y: number; w: number; h: number; }

export interface BlurConfig {
  file: File;
  mode: 'full' | 'region' | 'background';
  strength: number;
  region?: BlurRegion;
  startTime?: number | null;
  endTime?: number | null;
}

@Injectable({ providedIn: 'root' })
export class BlurService {
  private bridge = inject(WorkerBridgeService);

  /**
   * Nebula Engine processor.
   */
  process(config: BlurConfig): Observable<WorkerMessage<ArrayBuffer>> {
    const worker = new Worker(new URL('./blur.worker', import.meta.url), { type: 'module' });
    return this.bridge.runTask(worker, config);
  }

  getOutputFilename(originalName: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_nebula_${base}.mp4`;
  }
}