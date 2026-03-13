import { Injectable, inject } from '@angular/core';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { Observable } from 'rxjs';
import { WorkerMessage } from '../shared/types/video.types';

export interface TrimmerConfig {
  file: File;
  startTime: number;
  endTime: number;
  outputFormat: string;
}

@Injectable({ providedIn: 'root' })
export class TrimmerService {
  private workerBridge = inject(WorkerBridgeService);

  /**
   * Process a video trim operation.
   * Uses frame-accurate seeking (-ss before -i).
   */
  process(config: TrimmerConfig): Observable<WorkerMessage<ArrayBuffer>> {
    const worker = new Worker(new URL('./trimmer.worker', import.meta.url), { type: 'module' });
    return this.workerBridge.runTask(worker, config);
  }

  /**
   * Get the suggested output filename.
   */
  getOutputFilename(originalName: string, format: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_trimmed_${base}.${format}`;
  }
}