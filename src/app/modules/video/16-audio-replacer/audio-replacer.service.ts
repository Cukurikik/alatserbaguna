import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { VideoMeta, WorkerMessage } from '../shared/types/video.types';

export interface AudioReplacerConfig {
  videoFile: File;
  audioFile: File;
  mode: 'replace' | 'mix';
  originalVolume: number;
  newAudioVolume: number;
  loopAudio: boolean;
  videoMeta: VideoMeta;
}

@Injectable({ providedIn: 'root' })
export class AudioReplacerService {
  constructor(private bridge: WorkerBridgeService) {}

  /**
   * Build the FFmpeg amix filter_complex string for mixing two audio streams.
   * Uses 'first' duration mode so output matches video length.
   */
  buildMixFilter(originalVolume: number, newAudioVolume: number): string {
    return [
      `[0:a]volume=${originalVolume.toFixed(2)}[a1]`,
      `[1:a]volume=${newAudioVolume.toFixed(2)}[a2]`,
      `[a1][a2]amix=inputs=2:duration=first[aout]`,
    ].join(';');
  }

  /**
   * Validate whether audio is long enough to cover the video.
   * Returns 'ok', 'shorter', or 'longer'.
   */
  validateAudioDuration(
    videoMeta: VideoMeta,
    estimatedAudioDuration: number
  ): 'ok' | 'shorter' | 'longer' {
    const diff = estimatedAudioDuration - videoMeta.duration;
    if (Math.abs(diff) < 1) return 'ok';
    return diff < 0 ? 'shorter' : 'longer';
  }

  process(config: AudioReplacerConfig): Observable<WorkerMessage<ArrayBuffer>> {
    return this.bridge.runTask(new Worker(new URL('./audio-replacer.worker', import.meta.url), { type: 'module' }), config);
  }

  getOutputFilename(originalName: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_audio_replaced_${base}.mp4`;
  }
}