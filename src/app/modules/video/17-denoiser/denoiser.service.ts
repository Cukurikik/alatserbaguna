import { Injectable } from '@angular/core';
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

/** Estimated processing multiplier relative to video duration (in seconds of CPU time per second of video) */
export const ALGORITHM_SPEED_MULTIPLIER: Record<DenoiseAlgorithm, number> = {
  hqdn3d: 0.5,
  nlmeans: 10.0,
  atadenoise: 1.5,
};

@Injectable({ providedIn: 'root' })
export class DenoiserService {
  constructor(private bridge: WorkerBridgeService) {}

  /**
   * Build the hqdn3d FFmpeg filter string.
   * Parameters: luma_spatial:chroma_spatial:luma_tmp:chroma_tmp
   */
  mapStrengthToHqdn3d(lumaS: number, chromaS: number, lumaT: number): string {
    return `hqdn3d=${lumaS}:${chromaS}:${lumaT}:${chromaS}`;
  }

  /**
   * Build the nlmeans FFmpeg filter string.
   * Sigma (s) derived from strength value:  strength / 5 gives reasonable range.
   * p=7 (patch size), r=15 (search radius) are quality-balanced defaults.
   */
  mapStrengthToNlmeans(strength: number): string {
    const sigma = (strength / 5).toFixed(2);
    return `nlmeans=s=${sigma}:p=7:r=15`;
  }

  /**
   * Build the atadenoise FFmpeg filter string.
   */
  mapStrengthToAtadenoise(lumaS: number, chromaS: number): string {
    return `atadenoise=0a=${(lumaS / 20).toFixed(3)}:0b=${(chromaS / 20).toFixed(3)}`;
  }

  /**
   * Build the afftdn (audio denoise) filter string.
   * noise_floor controls sensitivity: 0–97 dB range.
   */
  buildAudioDenoiseFilter(noiseLevel: number): string {
    return `afftdn=nr=${noiseLevel}:nf=-25`;
  }

  /**
   * Estimate processing time (seconds) based on video duration and algorithm.
   */
  estimateProcessingTime(duration: number, algorithm: DenoiseAlgorithm): number {
    return Math.round(duration * ALGORITHM_SPEED_MULTIPLIER[algorithm]);
  }

  process(config: DenoiserConfig): Observable<WorkerMessage<ArrayBuffer>> {
    return this.bridge.process<DenoiserConfig, ArrayBuffer>(
      () => new Worker(new URL('./denoiser.worker', import.meta.url), { type: 'module' }),
      config
    );
  }

  getOutputFilename(originalName: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_denoised_${base}.mp4`;
  }
}