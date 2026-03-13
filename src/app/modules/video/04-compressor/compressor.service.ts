import { Injectable, inject } from '@angular/core';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { Observable } from 'rxjs';
import { WorkerMessage } from '../shared/types/video.types';

export interface CompressorConfig {
  file: File;
  outputFormat: string;
  crf: number;
  preset: string;
}

@Injectable({ providedIn: 'root' })
export class CompressorService {
  private workerBridge = inject(WorkerBridgeService);

  /**
   * High-efficiency video compression.
   * Leverages H.264/H.265 via WASM with priority-based CPU presets.
   */
  process(config: CompressorConfig): Observable<WorkerMessage<ArrayBuffer>> {
    const worker = new Worker(new URL('./compressor.worker', import.meta.url), { type: 'module' });
    return this.workerBridge.runTask(worker, config);
  }

  /**
   * Generate descriptive output filename.
   */
  getOutputFilename(originalName: string, format: string, crf: number): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_compressed_crf${crf}_${base}.${format}`;
  }
}