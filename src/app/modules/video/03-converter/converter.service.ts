import { Injectable, inject } from '@angular/core';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { Observable } from 'rxjs';
import { WorkerMessage } from '../shared/types/video.types';

export interface ConverterConfig {
  file: File;
  outputFormat: string;
  resolution: string;
  crf: number;
}

@Injectable({ providedIn: 'root' })
export class ConverterService {
  private workerBridge = inject(WorkerBridgeService);

  /**
   * Universal video converter.
   * Leverages WebGPU where applicable or falls back to WASM.
   */
  process(config: ConverterConfig): Observable<WorkerMessage<ArrayBuffer>> {
    const worker = new Worker(new URL('./converter.worker', import.meta.url), { type: 'module' });
    return this.workerBridge.runTask(worker, config);
  }

  /**
   * Helper to determine output filename.
   */
  getOutputFilename(originalName: string, format: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_converted_${base}.${format}`;
  }
}