import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage } from '../shared/types/video.types';

export interface Segment { start: number; end: number; }

export interface SplitterConfig {
  file: File;
  mode: 'markers' | 'equal';
  markers?: number[];
  equalParts?: number;
  totalDuration: number;
}

@Injectable({ providedIn: 'root' })
export class SplitterService {
  private bridge = inject(WorkerBridgeService);

  /**
   * Fracture Engine processor.
   */
  process(config: SplitterConfig): Observable<WorkerMessage<ArrayBuffer[]>> {
    const worker = new Worker(new URL('./splitter.worker', import.meta.url), { type: 'module' });
    return this.bridge.runTask(worker, config);
  }

  getOutputFilename(originalName: string, segmentIndex: number): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_fracture_${String(segmentIndex + 1).padStart(2, '0')}_${base}.mp4`;
  }
}