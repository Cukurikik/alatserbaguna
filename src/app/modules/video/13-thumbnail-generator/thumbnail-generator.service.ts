import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage } from '../shared/types/video.types';

export interface ThumbnailConfig {
  file: File;
  mode: 'single' | 'grid' | 'interval';
  timestamp?: number;
  gridCols?: number;
  gridRows?: number;
  intervalSeconds?: number;
  imageFormat: 'jpg' | 'png' | 'webp';
  jpgQuality: number;
  videoDuration: number;
}

@Injectable({ providedIn: 'root' })
export class ThumbnailGeneratorService {
  constructor(private bridge: WorkerBridgeService) {}

  /**
   * Build the FFmpeg tile filter for generating a grid of thumbnails.
   * Preview thumbnails capped at 1280px wide to avoid huge files.
   */
  buildTileFilter(cols: number, rows: number, interval: number, width = 1280): string {
    return `fps=1/${interval},scale=${width}:-1:flags=lanczos,tile=${cols}x${rows}`;
  }

  /**
   * Build the FFmpeg filter for interval-based frame extraction.
   */
  buildIntervalFilter(interval: number, width = 1280): string {
    return `fps=1/${interval},scale=${width}:-1:flags=lanczos`;
  }

  /**
   * Calculate actual grid dimensions that fit the total available frames.
   */
  calculateGridDimensions(
    duration: number,
    interval: number,
    requestedCols: number,
    requestedRows: number
  ): { actualCols: number; actualRows: number; totalFrames: number } {
    const totalFrames = Math.floor(duration / interval);
    const actualCols = Math.min(requestedCols, totalFrames);
    const actualRows = Math.min(requestedRows, Math.ceil(totalFrames / actualCols));
    return { actualCols, actualRows, totalFrames };
  }

  /**
   * Estimate total number of output thumbnails.
   */
  estimateOutputCount(
    mode: 'single' | 'grid' | 'interval',
    duration: number,
    intervalSeconds = 1,
    cols = 4,
    rows = 4
  ): number {
    switch (mode) {
      case 'single': return 1;
      case 'interval': return Math.floor(duration / intervalSeconds);
      case 'grid': return cols * rows;
    }
  }

  process(config: ThumbnailConfig): Observable<WorkerMessage<ArrayBuffer>> {
    return this.bridge.process<ThumbnailConfig, ArrayBuffer>(
      () => new Worker(new URL('./thumbnail-generator.worker', import.meta.url), { type: 'module' }),
      config
    );
  }

  getOutputFilename(originalName: string, mode: string, format: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_thumb_${mode}_${base}.${format}`;
  }
}