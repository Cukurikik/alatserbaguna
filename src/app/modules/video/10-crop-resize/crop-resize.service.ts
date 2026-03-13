import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { VideoMeta, WorkerMessage } from '../shared/types/video.types';

export interface CropResizeConfig {
  file: File;
  mode: 'crop' | 'resize';
  cropRegion?: { x: number; y: number; w: number; h: number };
  targetWidth?: number;
  targetHeight?: number;
  padMode: 'stretch' | 'pad' | 'crop-to-fit';
  videoMeta: VideoMeta;
}

@Injectable({ providedIn: 'root' })
export class CropResizeService {
  private bridge = inject(WorkerBridgeService);

  /**
   * Universal geometry processor.
   */
  process(config: CropResizeConfig): Observable<WorkerMessage<ArrayBuffer>> {
    const worker = new Worker(new URL('./crop-resize.worker', import.meta.url), { type: 'module' });
    return this.bridge.runTask(worker, config);
  }

  /**
   * Safe aspect ratio calculator with overflow prevention.
   */
  calculateDimensions(w: number, h: number, target: number, byWidth: boolean): [number, number] {
    const ratio = w / h;
    return byWidth ? [target, Math.round(target / ratio)] : [Math.round(target * ratio), target];
  }

  getOutputFilename(originalName: string, mode: 'crop' | 'resize'): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_${mode}_${base}.mp4`;
  }
}