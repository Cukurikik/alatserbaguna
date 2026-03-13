import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage } from '../shared/types/video.types';

export interface Clip { path: string; duration: number; }
export interface Transition { type: string; duration: number; }

export interface TransitionsConfig {
  clips: File[];
  transitions: Transition[];
}

@Injectable({ providedIn: 'root' })
export class TransitionsService {
  constructor(private bridge: WorkerBridgeService) {}

  /**
   * Build the FFmpeg filter_complex string for N clips with xfade transitions.
   * Chains transitions progressively: [0][1]xfade→[v01], [v01][2]xfade→[v02], ...
   * Offset formula: sum of previous clip durations minus accumulated overlaps.
   */
  buildXfadeFilterComplex(clips: Clip[], transitions: Transition[]): string {
    if (clips.length < 2) return '';
    const parts: string[] = [];
    let cumulativeOffset = 0;
    let prevLabel = '[0:v]';

    for (let i = 0; i < transitions.length; i++) {
      const t = transitions[i];
      const isLast = i === transitions.length - 1;
      const outLabel = isLast ? '[vout]' : `[v${String(i).padStart(2, '0')}]`;
      const offset = cumulativeOffset + clips[i].duration - t.duration;

      parts.push(
        `${prevLabel}[${i + 1}:v]xfade=transition=${t.type}:duration=${t.duration}:offset=${offset.toFixed(3)}${outLabel}`
      );

      cumulativeOffset = offset;
      prevLabel = outLabel;
    }
    return parts.join(';');
  }

  process(config: TransitionsConfig): Observable<WorkerMessage<ArrayBuffer>> {
    return this.bridge.process<TransitionsConfig, ArrayBuffer>(
      () => new Worker(new URL('./transitions.worker', import.meta.url), { type: 'module' }),
      config
    );
  }

  getOutputFilename(originalName: string): string {
    return `omni_transitions_${originalName.replace(/\.[^.]+$/, '')}.mp4`;
  }
}