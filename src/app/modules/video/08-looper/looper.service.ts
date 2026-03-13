import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { VideoMeta, WorkerMessage } from '../shared/types/video.types';

export interface Segment { start: number; end: number; }

export interface LooperConfig {
  file: File;
  mode: 'count' | 'duration';
  loopCount?: number;
  targetDuration?: number;
  crossfade: boolean;
  crossfadeDuration: number;
  videoMeta: VideoMeta;
}

@Injectable({ providedIn: 'root' })
export class LooperService {
  constructor(private bridge: WorkerBridgeService) {}

  /**
   * Build the FFmpeg concat list referencing the same file N times.
   * Uses memory-only (no disk I/O beyond existing OPFS file).
   */
  buildConcatList(filePath: string, count: number): string {
    return Array.from({ length: count }, () => `file '${filePath}'`).join('\n');
  }

  /**
   * Calculate how many loops are needed to fill a target duration.
   */
  calculateRepeatCount(targetDuration: number, clipDuration: number): number {
    return Math.ceil(targetDuration / clipDuration);
  }

  /**
   * Calculate the total output duration for either mode.
   */
  calculateOutputDuration(
    mode: 'count' | 'duration',
    loopCount: number,
    clipDuration: number,
    targetDuration: number
  ): number {
    return mode === 'count' ? clipDuration * loopCount : targetDuration;
  }

  /**
   * Build the xfade filter_complex for N video segments with crossfading.
   * @param segments number of clips (same file repeated)
   * @param xfadeDuration seconds of crossfade overlap
   * @param clipDuration duration of each clip in seconds
   */
  buildXfadeFilter(segments: number, xfadeDuration: number, clipDuration: number): string {
    if (segments < 2) return '';
    const parts: string[] = [];
    let prevLabel = '[0:v]';
    for (let i = 1; i < segments; i++) {
      const offset = (clipDuration * i) - (xfadeDuration * i);
      const outLabel = i === segments - 1 ? '[vout]' : `[v${String(i).padStart(2, '0')}]`;
      parts.push(
        `${prevLabel}[${i}:v]xfade=transition=fade:duration=${xfadeDuration}:offset=${offset.toFixed(3)}${outLabel}`
      );
      prevLabel = outLabel;
    }
    return parts.join(';');
  }

  process(config: LooperConfig): Observable<WorkerMessage<ArrayBuffer>> {
    return this.bridge.runTask(new Worker(new URL('./looper.worker', import.meta.url), { type: 'module' }), config);
  }

  getOutputFilename(originalName: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_looped_${base}.mp4`;
  }
}