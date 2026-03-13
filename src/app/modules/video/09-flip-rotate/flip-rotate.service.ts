import { Injectable, inject } from '@angular/core';
import { FFmpegService } from '../shared/engine/ffmpeg.service';
import { VideoMeta } from '../shared/types/video.types';

@Injectable({
  providedIn: 'root'
})
export class FlipRotateService {
  private ffmpegService = inject(FFmpegService);

  async getMetadata(file: File): Promise<VideoMeta> {
    return this.ffmpegService.getMetadata(file);
  }

  buildFilterChain(flipH: boolean, flipV: boolean, rotation: number): string {
    const filters: string[] = [];
    
    if (flipH) filters.push('hflip');
    if (flipV) filters.push('vflip');
    
    if (rotation === 90) {
      filters.push('transpose=1');
    } else if (rotation === 180) {
      filters.push('vflip,hflip');
    } else if (rotation === 270) {
      filters.push('transpose=2');
    } else if (rotation !== 0) {
      filters.push(`rotate=${rotation}*PI/180`);
    }
    
    return filters.join(',');
  }

  calculateOutputDimensions(w: number, h: number, rotation: number): { width: number; height: number } {
    if (rotation === 90 || rotation === 270) {
      return { width: h, height: w };
    }
    // For arbitrary rotations, the bounding box changes, but we'll approximate or just return original for now
    // FFmpeg rotate filter by default keeps the original size unless ow/oh are specified.
    // We'll just return the original dimensions for arbitrary rotations.
    return { width: w, height: h };
  }
}
