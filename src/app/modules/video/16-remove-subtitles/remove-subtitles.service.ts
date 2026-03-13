import { Injectable, inject } from '@angular/core';
import { FFmpegService } from '../shared/engine/ffmpeg.service';
import { VideoMeta } from '../shared/types/video.types';

@Injectable({
  providedIn: 'root'
})
export class RemoveSubtitlesService {
  private ffmpegService = inject(FFmpegService);

  async getMetadata(file: File): Promise<VideoMeta> {
    return this.ffmpegService.getMetadata(file);
  }
}
