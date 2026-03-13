import { Injectable, inject } from '@angular/core';
import { FFmpegService } from '../shared/engine/ffmpeg.service';
import { VideoMeta } from '../shared/types/video.types';

@Injectable({
  providedIn: 'root'
})
export class ReverserService {
  private ffmpegService = inject(FFmpegService);

  async getMetadata(file: File): Promise<VideoMeta> {
    return this.ffmpegService.getMetadata(file);
  }

  calculateSegments(duration: number): { start: number; end: number }[] {
    const segments = [];
    const segmentDuration = 30;
    const segmentCount = Math.ceil(duration / segmentDuration);

    for (let i = 0; i < segmentCount; i++) {
      segments.push({
        start: i * segmentDuration,
        end: Math.min((i + 1) * segmentDuration, duration)
      });
    }

    return segments;
  }
}
