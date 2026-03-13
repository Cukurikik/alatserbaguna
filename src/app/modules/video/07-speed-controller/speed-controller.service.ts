import { Injectable } from '@angular/core';
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
  constructor(private bridge: WorkerBridgeService) {}

  /**
   * Build the atempo filter chain for pitch-corrected audio.
   * Each atempo filter only accepts values 0.5–2.0.
   * For speed > 2.0 or < 0.5, chain multiple filters.
   * Example: 4.0 → ['atempo=2.0', 'atempo=2.0']
   * Example: 3.0 → ['atempo=2.0', 'atempo=1.5']
   * Example: 0.25 → ['atempo=0.5', 'atempo=0.5']
   */
  buildAtempoChain(speed: number): string[] {
    if (speed >= 0.5 && speed <= 2.0) {
      return [`atempo=${speed.toFixed(4)}`];
    }
    const chain: string[] = [];
    let remaining = speed;
    // Handle speeds > 2.0 by chaining atempo=2.0
    while (remaining > 2.0) {
      chain.push('atempo=2.0');
      remaining /= 2.0;
    }
    // Handle speeds < 0.5 by chaining atempo=0.5
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
   * Calculate the new duration after applying speed.
   * Round to 2 decimal places.
   */
  calculateNewDuration(originalSeconds: number, speed: number): number {
    return Math.round((originalSeconds / speed) * 100) / 100;
  }

  /**
   * Format seconds to human-readable "Xm Ys" display.
   */
  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  }

  process(config: SpeedConfig): Observable<WorkerMessage<ArrayBuffer>> {
    return this.bridge.process<SpeedConfig, ArrayBuffer>(
      () => new Worker(new URL('./speed-controller.worker', import.meta.url), { type: 'module' }),
      config
    );
  }

  getOutputFilename(originalName: string, speed: number): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_speed${speed}x_${base}.mp4`;
  }
}