import { Injectable } from '@angular/core';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

@Injectable({ providedIn: 'root' })
export class StemSplitterService {
  constructor(private ffmpegAudio: FfmpegAudioService) {}

  getOutputFilename(original: string, format: string): string {
    const base = original.replace(/\.[^.]+$/, '');
    return `omni_stem-splitter_${base}.${format}`;
  }
}
