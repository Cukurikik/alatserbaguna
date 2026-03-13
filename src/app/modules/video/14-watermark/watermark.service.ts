import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { VideoMeta, WorkerMessage } from '../shared/types/video.types';

export type WatermarkPosition = 'TL' | 'TC' | 'TR' | 'ML' | 'MC' | 'MR' | 'BL' | 'BC' | 'BR';

export interface WatermarkConfig {
  videoFile: File;
  mode: 'image' | 'text';
  watermarkFile?: File;
  text?: string;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  position: WatermarkPosition;
  opacity: number;  // 0–1
  scale: number;    // 0.01–0.9
  videoMeta: VideoMeta;
}

const MARGIN = 20;

@Injectable({ providedIn: 'root' })
export class WatermarkService {
  constructor(private bridge: WorkerBridgeService) {}

  /**
   * Calculate the pixel coordinates for a watermark given its position key.
   * Handles all 9 positions (3×3 grid).
   */
  calculatePosition(
    pos: WatermarkPosition,
    videoW: number,
    videoH: number,
    wmW: number,
    wmH: number,
    margin = MARGIN
  ): { x: number; y: number } {
    const row = pos[0] as 'T' | 'M' | 'B';
    const col = pos[1] as 'L' | 'C' | 'R';

    const x = col === 'L' ? margin
             : col === 'R' ? videoW - wmW - margin
             : Math.round((videoW - wmW) / 2);  // C

    const y = row === 'T' ? margin
             : row === 'B' ? videoH - wmH - margin
             : Math.round((videoH - wmH) / 2);  // M

    return { x, y };
  }

  /**
   * Scale the watermark width to a percentage of the video width.
   */
  scaleToVideoWidth(videoWidth: number, scale: number): number {
    return Math.round(videoWidth * scale);
  }

  process(config: WatermarkConfig): Observable<WorkerMessage<ArrayBuffer>> {
    return this.bridge.runTask(new Worker(new URL('./watermark.worker', import.meta.url), { type: 'module' }), config);
  }

  getOutputFilename(originalName: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_watermarked_${base}.mp4`;
  }
}