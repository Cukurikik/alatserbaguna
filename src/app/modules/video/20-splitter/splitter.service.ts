import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage } from '../shared/types/video.types';

export interface Segment { start: number; end: number; }

export interface SplitterConfig {
  file: File;
  mode: 'markers' | 'equal';
  markers?: number[];
  equalParts?: number;
  totalDuration: number;
}

@Injectable({ providedIn: 'root' })
export class SplitterService {
  constructor(private bridge: WorkerBridgeService) {}

  /** Sort markers ascending, remove duplicates and out-of-range values. */
  sortMarkers(markers: number[], duration: number): number[] {
    return [...new Set(markers)]
      .filter(m => m > 0 && m < duration)
      .sort((a, b) => a - b);
  }

  /** Convert sorted markers to segment pairs (adds 0 and duration as boundaries). */
  markersToSegments(markers: number[], totalDuration: number): Segment[] {
    const points = [0, ...this.sortMarkers(markers, totalDuration), totalDuration];
    const segments: Segment[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      segments.push({ start: points[i], end: points[i + 1] });
    }
    return segments;
  }

  /** Divide a video into N equal-duration segments. */
  calculateEqualSegments(totalDuration: number, parts: number): Segment[] {
    const segDur = totalDuration / parts;
    return Array.from({ length: parts }, (_, i) => ({
      start: i * segDur,
      end: Math.min((i + 1) * segDur, totalDuration),
    }));
  }

  process(config: SplitterConfig): Observable<WorkerMessage<ArrayBuffer>> {
    return this.bridge.process<SplitterConfig, ArrayBuffer>(
      () => new Worker(new URL('./splitter.worker', import.meta.url), { type: 'module' }),
      config
    );
  }

  getOutputFilename(originalName: string, segmentIndex: number): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_split_${String(segmentIndex + 1).padStart(2, '0')}_${base}.mp4`;
  }
}