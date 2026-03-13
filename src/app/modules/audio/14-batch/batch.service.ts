import { Injectable } from '@angular/core';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

@Injectable({ providedIn: 'root' })
export class BatchService {
  constructor(private ffmpegAudio: FfmpegAudioService) {}

  getOutputFilename(original: string, format: string): string {
    const base = original.replace(/\.[^.]+$/, '');
    return `omni_batch_${base}.${format}`;
  }
}
