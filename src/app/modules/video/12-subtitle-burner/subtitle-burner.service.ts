import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage } from '../shared/types/video.types';

export interface BurnerConfig {
  videoFile: File;
  srtFile: File;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  position: 'top' | 'bottom';
}

@Injectable({ providedIn: 'root' })
export class SubtitleBurnerService {
  private bridge = inject(WorkerBridgeService);

  /**
   * Subtitle forge processor.
   */
  process(config: BurnerConfig): Observable<WorkerMessage<ArrayBuffer>> {
    const worker = new Worker(new URL('./subtitle-burner.worker', import.meta.url), { type: 'module' });
    return this.bridge.runTask(worker, config);
  }

  getOutputFilename(originalName: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_forged_${base}.mp4`;
  }
}