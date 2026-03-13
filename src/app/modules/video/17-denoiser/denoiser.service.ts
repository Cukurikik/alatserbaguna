import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage } from '../shared/types/video.types';

export type DenoiseAlgorithm = 'hqdn3d' | 'nlmeans' | 'atadenoise';

export interface DenoiserConfig {
  file: File;
  algorithm: DenoiseAlgorithm;
  lumaStrength: number;
  chromaStrength: number;
  temporalStrength: number;
  denoiseAudio: boolean;
  audioNoiseLevel: number;
}

@Injectable({ providedIn: 'root' })
export class DenoiserService {
  private bridge = inject(WorkerBridgeService);

  /**
   * Silence Engine processor.
   */
  process(config: DenoiserConfig): Observable<WorkerMessage<ArrayBuffer>> {
    const worker = new Worker(new URL('./denoiser.worker', import.meta.url), { type: 'module' });
    return this.bridge.runTask(worker, config);
  }

  getOutputFilename(originalName: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_silent_${base}.mp4`;
  }
}