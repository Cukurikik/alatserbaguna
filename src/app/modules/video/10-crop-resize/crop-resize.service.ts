import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage } from '../shared/types/video.types';

export interface CropRegion { x: number; y: number; w: number; h: number; }

export interface SocialPreset { label: string; w: number; h: number; }

export interface CropResizeConfig {
  file: File;
  mode: 'crop' | 'resize';
  cropRegion?: CropRegion;
  targetWidth?: number;
  targetHeight?: number;
  lockAspectRatio: boolean;
  padMode: 'stretch' | 'pad' | 'crop-to-fit';
}

export const SOCIAL_MEDIA_PRESETS: Record<string, SocialPreset> = {
  'tiktok':            { label: 'TikTok',            w: 1080, h: 1920 },
  'youtube':           { label: 'YouTube',            w: 1920, h: 1080 },
  'instagram-square': { label: 'Instagram Square',   w: 1080, h: 1080 },
  'instagram-story':  { label: 'Instagram Story',    w: 1080, h: 1920 },
  'twitter':           { label: 'Twitter / X',        w: 1280, h:  720 },
};

@Injectable({ providedIn: 'root' })
export class CropResizeService {
  private readonly bridge = inject(WorkerBridgeService);

  /**
   * Build the FFmpeg scale filter with optional aspect-ratio handling.
   * Uses lanczos algorithm for best quality on both up and downscale.
   */
  buildScaleFilter(
    targetW: number,
    targetH: number,
    lockAspect: boolean,
    padMode: 'stretch' | 'pad' | 'crop-to-fit'
  ): string {
    const w = this.ensureDivisibleBy2(targetW);
    const h = this.ensureDivisibleBy2(targetH);

    if (!lockAspect) {
      return `scale=${w}:${h}:flags=lanczos`;
    }
    if (padMode === 'pad') {
      return [
        `scale=${w}:${h}:flags=lanczos:force_original_aspect_ratio=decrease`,
        `pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2`
      ].join(',');
    }
    if (padMode === 'crop-to-fit') {
      return [
        `scale=${w}:${h}:flags=lanczos:force_original_aspect_ratio=increase`,
        `crop=${w}:${h}`
      ].join(',');
    }
    // stretch fallback
    return `scale=${w}:${h}:flags=lanczos`;
  }

  /**
   * Ensure pixel dimension is divisible by 2 (required by H.264/H.265 encoders).
   */
  ensureDivisibleBy2(n: number): number {
    return n % 2 === 0 ? n : n - 1;
  }

  /**
   * Build the FFmpeg crop filter string.
   */
  buildCropFilter(region: CropRegion): string {
    const w = this.ensureDivisibleBy2(region.w);
    const h = this.ensureDivisibleBy2(region.h);
    return `crop=${w}:${h}:${region.x}:${region.y}`;
  }

  process(config: CropResizeConfig): Observable<WorkerMessage<ArrayBuffer>> {
    return this.bridge.runTask(new Worker(new URL('./crop-resize.worker', import.meta.url), { type: 'module' }), config);
  }

  getOutputFilename(originalName: string, mode: 'crop' | 'resize'): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_${mode}_${base}.mp4`;
  }
}