import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { VideoMeta, WorkerMessage } from '../shared/types/video.types';

export interface SpeedConfig {
  file: File;
  speed: number;
  audioMode: 'keep' | 'mute' | 'pitchCorrect';
  videoMeta: VideoMeta;
}

@Injectable({ providedIn: 'root' })
export class SpeedControllerService {
  private bridge = inject(WorkerBridgeService);

  /**
   * Build the atempo filter chain for pitch-corrected audio.
   * Each atempo filter only accepts values 0.5–2.0.
   */
  buildAtempoChain(speed: number): string[] {
    if (speed >= 0.5 && speed <= 2.0) {
      return [`atempo=${speed.toFixed(4)}`];
    }
    const chain: string[] = [];
    let remaining = speed;
    while (remaining > 2.0) {
      chain.push('atempo=2.0');
      remaining /= 2.0;
    }
    while (remaining < 0.5) {
      chain.push('atempo=0.5');
      remaining /= 0.5;
    }
    if (Math.abs(remaining - 1.0) > 0.001) {
      chain.push(`atempo=${remaining.toFixed(4)}`);
    }
    return chain;
  }

  /**
   * Calculate exact predicted duration.
   */
  calculateNewDuration(originalSeconds: number, speed: number): number {
    return Math.round((originalSeconds / speed) * 100) / 100;
  }

  /**
   * Universal speed processor.
   */
  process(config: SpeedConfig): Observable<WorkerMessage<ArrayBuffer>> {
    const worker = new Worker(new URL('./speed-controller.worker', import.meta.url), { type: 'module' });
    return this.bridge.runTask(worker, config);
  }

  /**
   * Descriptive filename generator.
   */
  getOutputFilename(originalName: string, speed: number): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    const cleanSpeed = speed.toString().replace('.', '_');
    return `omni_speed_${cleanSpeed}x_${base}.mp4`;
  }
}