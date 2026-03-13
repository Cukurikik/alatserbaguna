import { Injectable, inject } from '@angular/core';
import { FFmpegService } from '../shared/engine/ffmpeg.service';
import { VideoMeta } from '../shared/types/video.types';

@Injectable({
  providedIn: 'root'
})
export class LooperService {
  private ffmpegService = inject(FFmpegService);

  async getMetadata(file: File): Promise<VideoMeta> {
    return this.ffmpegService.getMetadata(file);
  }

  buildConcatList(filePath: string, count: number): string {
    let list = '';
    for (let i = 0; i < count; i++) {
      list += `file '${filePath}'\n`;
    }
    return list;
  }

  calculateRepeatCount(targetDuration: number, clipDuration: number): number {
    return Math.ceil(targetDuration / clipDuration);
  }

  calculateOutputDuration(mode: 'count' | 'duration', loopCount: number, clipDuration: number, targetDuration: number): number {
    if (mode === 'count') {
      return clipDuration * loopCount;
    } else {
      return targetDuration;
    }
  }

  buildXfadeFilter(segments: number, xfadeDuration: number, clipDuration: number): string {
    let filter = '';
    let lastOut = '[0]';
    for (let i = 1; i < segments; i++) {
      const offset = (clipDuration * i) - (xfadeDuration * i);
      const outLabel = i === segments - 1 ? '[vout]' : `[v0${i}]`;
      filter += `${lastOut}[${i}]xfade=transition=fade:duration=${xfadeDuration}:offset=${offset}${outLabel};`;
      lastOut = outLabel;
    }
    return filter.slice(0, -1); // remove trailing semicolon
  }

  formatDuration(seconds: number): string {
    if (isNaN(seconds) || !isFinite(seconds)) return '00:00:00';
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
}
