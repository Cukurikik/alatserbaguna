import { Injectable } from '@angular/core';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';
import { AudioMeta } from '../shared/types/audio.types';

@Injectable({ providedIn: 'root' })
export class TranscriberService {
  constructor(private ffmpeg: FfmpegAudioService) {}

  async getMetadata(file: File): Promise<AudioMeta> {
    return {
      filename: file.name,
      fileSizeMB: file.size / 1024 / 1024,
      duration: 0,
      sampleRate: 44100,
      channels: 2,
      bitDepth: 16,
      bitrate: 128,
      codec: file.name.split('.').pop() ?? 'unknown',
      hasVideo: false,
    };
  }

  getOutputFilename(original: string, format: string): string {
    return this.ffmpeg.getOutputFilename(original, format, 'transcriber');
  }
}
