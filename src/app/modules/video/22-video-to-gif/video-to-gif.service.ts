import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage } from '../shared/types/video.types';

export type DitherMode = 'none' | 'bayer' | 'floyd_steinberg';

export interface VideoToGifConfig {
  file: File;
  startTime: number;
  endTime: number;
  fps: number;
  width: number | 'auto';
  dither: DitherMode;
}

const DITHER_MAP: Record<DitherMode, string> = {
  none: 'none',
  bayer: 'bayer:bayer_scale=5',
  floyd_steinberg: 'floyd_steinberg',
};

@Injectable({ providedIn: 'root' })
export class VideoToGifService {
  constructor(private bridge: WorkerBridgeService) {}

  /** Build the palette generation pass filter. */
  buildPalettegenFilter(fps: number, width: number | 'auto'): string {
    const w = width === 'auto' ? '-1' : String(width);
    return `fps=${fps},scale=${w}:-1:flags=lanczos,palettegen=max_colors=256:stats_mode=diff`;
  }

  /** Build the palette use pass filter with selected dithering method. */
  buildPaletteUseFilter(fps: number, width: number | 'auto', dither: DitherMode): string {
    const w = width === 'auto' ? '-1' : String(width);
    const d = DITHER_MAP[dither];
    return `fps=${fps},scale=${w}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=${d}`;
  }

  /**
   * Rough GIF file size estimate in MB.
   * GIF is per-frame uncompressed: width × height × 3 bytes × frames / 256 colors.
   */
  estimateGifSize(fps: number, width: number, duration: number): number {
    const h = Math.round(width * 9 / 16);
    const frames = fps * duration;
    const bytes = width * h * 3 * frames / 256;
    return parseFloat((bytes / (1024 * 1024)).toFixed(2));
  }

  process(config: VideoToGifConfig): Observable<WorkerMessage<ArrayBuffer>> {
    return this.bridge.runTask(new Worker(new URL('./video-to-gif.worker', import.meta.url), { type: 'module' }), config);
  }

  getOutputFilename(originalName: string): string {
    return `omni_gif_${originalName.replace(/\.[^.]+$/, '')}.gif`;
  }
}