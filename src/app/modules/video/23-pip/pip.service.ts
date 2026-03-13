import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { VideoMeta, WorkerMessage } from '../shared/types/video.types';

export type PipPosition = 'TL' | 'TR' | 'BL' | 'BR';

export interface PipConfig {
  mainFile: File;
  overlayFile: File;
  pipWidthPercent: number;
  position: PipPosition;
  startTime: number | null;
  endTime: number | null;
  borderRadius: number;
  mainMeta: VideoMeta;
  overlayMeta: VideoMeta;
}

@Injectable({ providedIn: 'root' })
export class PipService {
  private bridge = inject(WorkerBridgeService);

  /**
   * Visto Engine processor.
   */
  process(config: PipConfig): Observable<WorkerMessage<ArrayBuffer>> {
    const worker = new Worker(new URL('./pip.worker', import.meta.url), { type: 'module' });
    return this.bridge.runTask(worker, config);
  }

  getOutputFilename(originalName: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_visto_${base}.mp4`;
  }
}