import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage, VideoMeta } from '../shared/types/video.types';

export type InterpolatorAlgorithm = 'duplicate' | 'motion';

export interface InterpolatorConfig {
  file: File;
  targetFPS: '24' | '30' | '60' | '120';
  algorithm: InterpolatorAlgorithm;
  videoMeta: VideoMeta;
}

@Injectable({ providedIn: 'root' })
export class InterpolatorService {
  constructor(private bridge: WorkerBridgeService) {}

  /**
   * Validate that target FPS is higher than input FPS.
   */
  canInterpolate(inputFPS: number, targetFPS: number): boolean {
    return targetFPS > inputFPS;
  }

  /**
   * Build the duplicate-method fps filter string.
   * This just instructs FFmpeg to output at the target rate by duplicating frames.
   */
  buildFpsFilter(targetFPS: string): string {
    return `fps=${targetFPS}`;
  }

  /**
   * Build the motion-compensated minterpolate filter string.
   * Uses MCI (motion-compensated interpolation) with AOBMC refinement.
   */
  buildMinterpolateFilter(targetFPS: string): string {
    return `minterpolate='mi_mode=mci:mc_mode=aobmc:vsbmc=1:fps=${targetFPS}'`;
  }

  /**
   * Estimate processing time in seconds.
   * duplicate: 10% of video duration
   * motion: 20× video duration (very slow)
   */
  estimateProcessingTime(durationSeconds: number, algorithm: InterpolatorAlgorithm): number {
    return algorithm === 'duplicate'
      ? Math.round(durationSeconds * 0.1)
      : Math.round(durationSeconds * 20);
  }

  process(config: InterpolatorConfig): Observable<WorkerMessage<ArrayBuffer>> {
    return this.bridge.process<InterpolatorConfig, ArrayBuffer>(
      () => new Worker(new URL('./interpolator.worker', import.meta.url), { type: 'module' }),
      config
    );
  }

  getOutputFilename(originalName: string, targetFPS: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_${targetFPS}fps_${base}.mp4`;
  }
}