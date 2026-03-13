import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage } from '../shared/types/video.types';

export interface ColorGradingConfig {
  file: File;
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  gamma: number;
  sharpness: number;
}

@Injectable({ providedIn: 'root' })
export class ColorGradingService {
  private bridge = inject(WorkerBridgeService);

  /**
   * Spectral spectral transformer processor.
   */
  process(config: ColorGradingConfig): Observable<WorkerMessage<ArrayBuffer>> {
    const worker = new Worker(new URL('./color-grading.worker', import.meta.url), { type: 'module' });
    return this.bridge.runTask(worker, config);
  }

  getOutputFilename(originalName: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_chroma_${base}.mp4`;
  }
}