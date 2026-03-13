import { Injectable, inject } from '@angular/core';
import { FFmpegService } from '../shared/engine/ffmpeg.service';
import { VideoMeta } from '../shared/types/video.types';

@Injectable({
  providedIn: 'root'
})
export class CropResizeService {
  private ffmpegService = inject(FFmpegService);

  readonly socialMediaPresets = new Map<string, { w: number, h: number }>([
    ['tiktok', { w: 1080, h: 1920 }],
    ['youtube', { w: 1920, h: 1080 }],
    ['instagram-square', { w: 1080, h: 1080 }],
    ['instagram-story', { w: 1080, h: 1920 }],
    ['twitter', { w: 1280, h: 720 }]
  ]);

  async getMetadata(file: File): Promise<VideoMeta> {
    return this.ffmpegService.getMetadata(file);
  }

  buildScaleFilter(targetW: number, targetH: number, lockAspect: boolean, padMode: 'stretch' | 'pad' | 'crop-to-fit'): string {
    const w = this.ensureDivisibleBy2(targetW);
    const h = this.ensureDivisibleBy2(targetH);

    if (lockAspect) {
      if (padMode === 'pad') {
        return `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2`;
      } else if (padMode === 'crop-to-fit') {
        return `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}`;
      }
    }
    
    // stretch or lockAspect without pad/crop
    return `scale=${w}:${h}`;
  }

  ensureDivisibleBy2(n: number): number {
    const rounded = Math.round(n);
    return rounded % 2 === 0 ? rounded : rounded - 1;
  }
}
