import { Injectable, inject } from '@angular/core';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { Observable } from 'rxjs';
import { WorkerMessage } from '../shared/types/video.types';

@Injectable({ providedIn: 'root' })
export class MergerService {
  private workerBridge = inject(WorkerBridgeService);

  /**
   * Concatenate multiple video files.
   * Note: Files should ideally have the same resolution and codec for best results.
   */
  process(files: File[], outputFormat: string): Observable<WorkerMessage<ArrayBuffer>> {
    const worker = new Worker(new URL('./merger.worker', import.meta.url), { type: 'module' });
    return this.workerBridge.runTask(worker, { files, outputFormat });
  }

  /**
   * Get the suggested output filename for merged video.
   */
  getOutputFilename(format: string): string {
    const timestamp = new Date().getTime();
    return `omni_merged_${timestamp}.${format}`;
  }
}