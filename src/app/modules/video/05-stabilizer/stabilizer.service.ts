import { Injectable, inject } from '@angular/core';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { Observable } from 'rxjs';
import { WorkerMessage } from '../shared/types/video.types';

export interface StabilizerConfig {
  file: File;
  smoothing: number;
}

@Injectable({ providedIn: 'root' })
export class StabilizerService {
  private workerBridge = inject(WorkerBridgeService);

  /**
   * Smooth out camera shake.
   * Uses two-pass vidstabdetect and vidstabtransform filters.
   */
  process(config: StabilizerConfig): Observable<WorkerMessage<ArrayBuffer>> {
    const worker = new Worker(new URL('./stabilizer.worker', import.meta.url), { type: 'module' });
    return this.workerBridge.runTask(worker, config);
  }

  /**
   * Suggested output filename.
   */
  getOutputFilename(originalName: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_stabilized_${base}.mp4`;
  }
}