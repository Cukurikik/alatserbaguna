import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage } from '../shared/types/video.types';

export type DitherMode = 'none' | 'bayer' | 'floyd_steinberg';

export interface VideoToGifConfig {
  file: File;
  startTime: number;
  endTime: number;
  fps: number;
  width: number | 'auto';
  dither: DitherMode;
}

@Injectable({ providedIn: 'root' })
export class VideoToGifService {
  private bridge = inject(WorkerBridgeService);

  /**
   * Lumina Engine processor.
   */
  process(config: VideoToGifConfig): Observable<WorkerMessage<ArrayBuffer>> {
    const worker = new Worker(new URL('./video-to-gif.worker', import.meta.url), { type: 'module' });
    return this.bridge.runTask(worker, config);
  }

  getOutputFilename(originalName: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_lumina_${base}.gif`;
  }
}