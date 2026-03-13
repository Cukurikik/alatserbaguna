import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage } from '../shared/types/video.types';

export interface AudioExtractorConfig {
  file: File;
  outputFormat: 'wav' | 'mp3' | 'aac' | 'ogg' | 'flac';
  bitrate: 128 | 192 | 256 | 320;
  videoDuration: number;
}

const SAMPLE_RATE = 44100;
const CHANNELS = 2;
const BIT_DEPTH = 16;
const BYTES_PER_MB = 1024 * 1024;

@Injectable({ providedIn: 'root' })
export class AudioExtractorService {
  constructor(private bridge: WorkerBridgeService) {}

  /**
   * Estimate output file size before processing.
   * WAV uses PCM calculation; lossy formats use bitrate × duration.
   */
  estimateOutputSize(
    format: 'wav' | 'mp3' | 'aac' | 'ogg' | 'flac',
    bitrate: number,
    duration: number
  ): number {
    if (format === 'wav') {
      // PCM: sampleRate × channels × bitDepth × duration / 8 / 1024²
      return (SAMPLE_RATE * CHANNELS * BIT_DEPTH * duration) / 8 / BYTES_PER_MB;
    }
    if (format === 'flac') {
      // FLAC ≈ 50% of WAV
      return ((SAMPLE_RATE * CHANNELS * BIT_DEPTH * duration) / 8 / BYTES_PER_MB) * 0.5;
    }
    // MP3 / AAC / OGG: bitrate-based
    return (bitrate * 1000 * duration) / 8 / BYTES_PER_MB;
  }

  /**
   * Build a waveform data array (1000 points) from raw audio buffer data.
   * Downsamples to avoid rendering 44100+ points on canvas.
   */
  buildWaveformData(channelData: Float32Array): Float32Array {
    const POINTS = 1000;
    const step = Math.floor(channelData.length / POINTS);
    const waveform = new Float32Array(POINTS);
    for (let i = 0; i < POINTS; i++) {
      let max = 0;
      for (let j = 0; j < step; j++) {
        const sample = Math.abs(channelData[i * step + j] ?? 0);
        if (sample > max) max = sample;
      }
      waveform[i] = max;
    }
    return waveform;
  }

  process(config: AudioExtractorConfig): Observable<WorkerMessage<ArrayBuffer>> {
    return this.bridge.process<AudioExtractorConfig, ArrayBuffer>(
      () => new Worker(new URL('./audio-extractor.worker', import.meta.url), { type: 'module' }),
      config
    );
  }

  getOutputFilename(originalName: string, format: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_audio_${base}.${format}`;
  }
}