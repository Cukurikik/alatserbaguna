import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { VideoMeta, WorkerMessage } from '../shared/types/video.types';

export interface ReverserConfig {
  file: File;
  reverseAudio: boolean;
  videoMeta: VideoMeta;
}

@Injectable({ providedIn: 'root' })
export class ReverserService {
  constructor(private bridge: WorkerBridgeService) {}

  /**
   * Determine if segmented reverse is needed (video > 120 seconds).
   * Segmented reverse prevents WASM heap overflow (512MB default limit).
   */
  needsSegmentation(duration: number): boolean {
    return duration > 120;
  }

  /**
   * Calculate how many 30-second segments are needed.
   */
  calculateSegmentCount(duration: number): number {
    return Math.ceil(duration / 30);
  }

  /**
   * Process a video reversal. If duration > 120s, automatically uses
   * segmented approach (30s chunks reversed independently then concatenated).
   */
  process(config: ReverserConfig): Observable<WorkerMessage<ArrayBuffer>> {
    return this.bridge.runTask(new Worker(new URL('./reverser.worker', import.meta.url), { type: 'module' }), config);
  }

  /**
   * Get the suggested output filename.
   */
  getOutputFilename(originalName: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_reversed_${base}.mp4`;
  }
}