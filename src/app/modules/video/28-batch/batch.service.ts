import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage } from '../shared/types/video.types';

export interface BatchFileEntry { file: File; status: 'queued' | 'processing' | 'success' | 'error'; }

export interface BatchConfig {
  file: File;
  operation: string;
  config: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class BatchService {
  private readonly bridge = inject(WorkerBridgeService);

  /**
   * Hive Engine processor.
   */
  processFile(config: BatchConfig): Observable<WorkerMessage<ArrayBuffer>> {
    const worker = new Worker(new URL('./batch.worker', import.meta.url), { type: 'module' });
    return this.bridge.runTask(worker, config);
  }

  getOutputFilename(originalName: string, operation: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_hive_${operation}_${base}.mp4`;
  }
}