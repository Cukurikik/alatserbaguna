import { Injectable, inject } from '@angular/core';
import { FFmpegService } from '../shared/engine/ffmpeg.service';
import { VideoMeta } from '../shared/types/video.types';

@Injectable({
  providedIn: 'root'
})
export class ExtractAudioService {
  private ffmpegService = inject(FFmpegService);

  async getMetadata(file: File): Promise<VideoMeta> {
    return this.ffmpegService.getMetadata(file);
  }

  getAudioCodec(format: string): string {
    switch (format) {
      case 'mp3': return 'libmp3lame';
      case 'wav': return 'pcm_s16le';
      case 'aac': return 'aac';
      case 'ogg': return 'libvorbis';
      default: return 'libmp3lame';
    }
  }
}
