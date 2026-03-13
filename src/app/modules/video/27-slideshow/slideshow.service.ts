import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage } from '../shared/types/video.types';

export interface SlideshowConfig {
  images: File[];
  defaultDuration: number;
  kenBurns: boolean;
  perImageDuration?: number[];
  musicFile?: File;
  musicVolume?: number;
  loopMusic?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SlideshowService {
  private readonly bridge = inject(WorkerBridgeService);

  /**
   * Aura Engine processor.
   */
  process(config: SlideshowConfig): Observable<WorkerMessage<ArrayBuffer>> {
    const worker = new Worker(new URL('./slideshow.worker', import.meta.url), { type: 'module' });
    return this.bridge.runTask(worker, config);
  }

  getOutputFilename(): string {
    return `omni_aura_${Date.now()}.mp4`;
  }
}