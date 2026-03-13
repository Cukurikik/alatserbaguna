import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage } from '../shared/types/video.types';

export interface BatchFile { file: File; status: 'queued' | 'processing' | 'done' | 'error'; }

export interface BatchConfig {
  files: File[];
  operation: string;
  operationConfig: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class BatchService {
  constructor(private bridge: WorkerBridgeService) {}

  /**
   * Process a single file in the batch queue.
   * Always sequential — called by NgRx Effect one file at a time.
   */
  processFile(
    file: File,
    operation: string,
    operationConfig: Record<string, unknown>
  ): Observable<WorkerMessage<ArrayBuffer>> {
    return this.bridge.runTask(
      new Worker(new URL('./batch.worker', import.meta.url), { type: 'module' }),
      { file, operation, config: operationConfig }
    );
  }

  /**
   * Build operation-specific FFmpeg args by delegating to the raw config.
   * The actual arg building happens inside batch.worker.ts by routing to
   * the appropriate sub-service approach.
   */
  buildOperationSummary(operation: string, fileCount: number): string {
    return `${operation} × ${fileCount} files`;
  }

  getOutputFilename(originalName: string, operation: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_batch_${operation}_${base}.mp4`;
  }
}