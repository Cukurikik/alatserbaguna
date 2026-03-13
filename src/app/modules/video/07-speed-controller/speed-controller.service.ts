import { Injectable, inject } from '@angular/core';
import { FFmpegService } from '../shared/engine/ffmpeg.service';
import { VideoMeta } from '../shared/types/video.types';

@Injectable({
  providedIn: 'root'
})
export class SpeedControllerService {
  private ffmpegService = inject(FFmpegService);

  async getMetadata(file: File): Promise<VideoMeta> {
    return this.ffmpegService.getMetadata(file);
  }

  buildAtempoChain(speed: number): string[] {
    if (speed <= 2.0 && speed >= 0.5) {
      return [`atempo=${speed}`];
    }
    
    if (speed > 2.0) {
      const chain: string[] = [];
      let currentSpeed = speed;
      while (currentSpeed > 2.0) {
        chain.push('atempo=2.0');
        currentSpeed /= 2.0;
      }
      if (currentSpeed > 1.0) {
        chain.push(`atempo=${currentSpeed}`);
      }
      return chain;
    }
    
    if (speed < 0.5) {
      const chain: string[] = [];
      let currentSpeed = speed;
      while (currentSpeed < 0.5) {
        chain.push('atempo=0.5');
        currentSpeed /= 0.5;
      }
      if (currentSpeed < 1.0) {
        chain.push(`atempo=${currentSpeed}`);
      }
      return chain;
    }
    
    return [];
  }

  calculateNewDuration(original: number, speed: number): number {
    return Math.round((original / speed) * 100) / 100;
  }

  formatDuration(seconds: number): string {
    if (isNaN(seconds) || !isFinite(seconds)) return '0s';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }
}
