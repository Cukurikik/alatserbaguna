import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage } from '../shared/types/video.types';

export interface BlurRegion { x: number; y: number; w: number; h: number; }

export interface BlurConfig {
  file: File;
  mode: 'full' | 'region' | 'background';
  strength: number;
  region?: BlurRegion;
  startTime?: number | null;
  endTime?: number | null;
}

@Injectable({ providedIn: 'root' })
export class BlurService {
  constructor(private bridge: WorkerBridgeService) {}

  /** Build full-frame boxblur filter. */
  buildFullBlurFilter(strength: number): string {
    return `boxblur=${strength}:${Math.round(strength / 2)}`;
  }

  /**
   * Build region blur using crop + boxblur + overlay.
   * Crops the region, blurs it, then overlays back on original.
   */
  buildRegionBlurFilter(region: BlurRegion, strength: number): string {
    const { x, y, w, h } = region;
    return [
      `[0:v]crop=${w}:${h}:${x}:${y},boxblur=${strength}[blurred]`,
      `[0:v][blurred]overlay=${x}:${y}`,
    ].join(';');
  }

  /**
   * Build optional time-range enable clause.
   * Returns empty string if no time range specified (applies for full video).
   */
  buildTimeRangeEnable(start: number | null, end: number | null): string {
    if (start === null || end === null) return '';
    return `:enable='between(t,${start},${end})'`;
  }

  process(config: BlurConfig): Observable<WorkerMessage<ArrayBuffer>> {
    return this.bridge.runTask(new Worker(new URL('./blur.worker', import.meta.url), { type: 'module' }), config);
  }

  getOutputFilename(originalName: string): string {
    return `omni_blur_${originalName.replace(/\.[^.]+$/, '')}.mp4`;
  }
}