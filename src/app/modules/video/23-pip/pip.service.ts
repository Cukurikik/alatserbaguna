import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { VideoMeta, WorkerMessage } from '../shared/types/video.types';

export type PipPosition = 'TL' | 'TR' | 'BL' | 'BR';

export interface PipConfig {
  mainFile: File;
  overlayFile: File;
  pipWidthPercent: number;   // 5–80
  position: PipPosition;
  startTime: number | null;
  endTime: number | null;
  borderRadius: number;
  mainMeta: VideoMeta;
  overlayMeta: VideoMeta;
}

const POSITION_EXPR: Record<PipPosition, (w: string, h: string) => string> = {
  TL: (w, h) => `overlay=10:10`,
  TR: (w, h) => `overlay=W-${w}-10:10`,
  BL: (w, h) => `overlay=10:H-${h}-10`,
  BR: (w, h) => `overlay=W-${w}-10:H-${h}-10`,
};

@Injectable({ providedIn: 'root' })
export class PipService {
  constructor(private bridge: WorkerBridgeService) {}

  /** Calculate PiP overlay pixel dimensions from percentage of main video width. */
  calculatePipDimensions(
    mainMeta: VideoMeta,
    pipWidthPercent: number
  ): { w: number; h: number } {
    const w = Math.round(mainMeta.width * pipWidthPercent / 100);
    const h = Math.round(w * mainMeta.height / mainMeta.width);
    return { w, h };
  }

  /** Build the FFmpeg filter_complex for PiP with scale + overlay. */
  buildFilterComplex(
    position: PipPosition,
    pipW: number,
    pipH: number,
    startTime: number | null,
    endTime: number | null
  ): string {
    const enableClause = (startTime !== null && endTime !== null)
      ? `:enable='between(t,${startTime},${endTime})'`
      : '';
    const overlayFn = POSITION_EXPR[position];
    // Replace W/H placeholders with actual pixel coords
    const overlayPart = overlayFn(String(pipW), String(pipH));
    return `[1:v]scale=${pipW}:${pipH}[pip];[0:v][pip]${overlayPart}:shortest=1${enableClause}`;
  }

  process(config: PipConfig): Observable<WorkerMessage<ArrayBuffer>> {
    return this.bridge.process<PipConfig, ArrayBuffer>(
      () => new Worker(new URL('./pip.worker', import.meta.url), { type: 'module' }),
      config
    );
  }

  getOutputFilename(originalName: string): string {
    return `omni_pip_${originalName.replace(/\.[^.]+$/, '')}.mp4`;
  }
}