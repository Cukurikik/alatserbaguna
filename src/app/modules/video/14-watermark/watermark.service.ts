import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage, VideoMeta } from '../shared/types/video.types';

export type WatermarkPosition = 'TL' | 'TC' | 'TR' | 'ML' | 'MC' | 'MR' | 'BL' | 'BC' | 'BR';

export interface WatermarkConfig {
  videoFile: File;
  mode: 'image' | 'text';
  watermarkFile?: File;
  text?: string;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  position: WatermarkPosition;
  opacity: number;
  videoMeta: VideoMeta;
}

@Injectable({ providedIn: 'root' })
export class WatermarkService {
  private bridge = inject(WorkerBridgeService);

  /**
   * Brand Engine processor.
   */
  process(config: WatermarkConfig): Observable<WorkerMessage<ArrayBuffer>> {
    const worker = new Worker(new URL('./watermark.worker', import.meta.url), { type: 'module' });
    return this.bridge.runTask(worker, config);
  }

  getOutputFilename(originalName: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_branded_${base}.mp4`;
  }
}