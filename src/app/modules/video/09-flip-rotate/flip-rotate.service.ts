import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage } from '../shared/types/video.types';

export interface FlipRotateConfig {
  file: File;
  flipH: boolean;
  flipV: boolean;
  rotation: number;
}

@Injectable({ providedIn: 'root' })
export class FlipRotateService {
  private bridge = inject(WorkerBridgeService);

  /**
   * Universal spatial transformer processor.
   */
  process(config: FlipRotateConfig): Observable<WorkerMessage<ArrayBuffer>> {
    const worker = new Worker(new URL('./flip-rotate.worker', import.meta.url), { type: 'module' });
    return this.bridge.runTask(worker, config);
  }

  /**
   * Build the visual CSS transformation string for real-time preview.
   */
  getPreviewTransform(flipH: boolean, flipV: boolean, rotation: number): string {
    const scaleX = flipH ? -1 : 1;
    const scaleY = flipV ? -1 : 1;
    return `scale(${scaleX}, ${scaleY}) rotate(${rotation}deg)`;
  }

  getOutputFilename(originalName: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_matrix_${base}.mp4`;
  }
}