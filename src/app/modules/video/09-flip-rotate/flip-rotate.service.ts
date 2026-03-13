import { Injectable } from '@angular/core';
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
  constructor(private bridge: WorkerBridgeService) {}

  /**
   * Build the FFmpeg -vf filter string for the requested transformations.
   * Applies flip first, then rotation.
   * For 90/180/270: uses transpose/flip combinations (faster than rotate filter).
   */
  buildFilterChain(flipH: boolean, flipV: boolean, rotation: number): string {
    const filters: string[] = [];

    if (flipH) filters.push('hflip');
    if (flipV) filters.push('vflip');

    const normalizedRot = ((rotation % 360) + 360) % 360;
    if (normalizedRot === 90) {
      filters.push('transpose=1');       // 90° clockwise
    } else if (normalizedRot === 180) {
      filters.push('vflip,hflip');       // 180° — faster than rotate=PI
    } else if (normalizedRot === 270) {
      filters.push('transpose=2');       // 90° counter-clockwise
    } else if (normalizedRot !== 0) {
      // Arbitrary angle — use rotate filter (slower, needs ultrafast preset)
      filters.push(`rotate=${rotation}*PI/180`);
    }

    return filters.join(',');
  }

  /**
   * Calculate output dimensions after rotation.
   * 90° and 270° rotations swap width and height.
   */
  calculateOutputDimensions(
    w: number,
    h: number,
    rotation: number
  ): { width: number; height: number } {
    const normalizedRot = ((rotation % 360) + 360) % 360;
    if (normalizedRot === 90 || normalizedRot === 270) {
      return { width: h, height: w };
    }
    return { width: w, height: h };
  }

  process(config: FlipRotateConfig): Observable<WorkerMessage<ArrayBuffer>> {
    return this.bridge.process<FlipRotateConfig, ArrayBuffer>(
      () => new Worker(new URL('./flip-rotate.worker', import.meta.url), { type: 'module' }),
      config
    );
  }

  getOutputFilename(originalName: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_transformed_${base}.mp4`;
  }
}