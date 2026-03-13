import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage } from '../shared/types/video.types';

export interface ScreenRecorderConfig {
  audioSource: 'mic' | 'system' | 'both' | 'none';
  resolution: '1080p' | '720p' | '480p';
  outputFormat: 'mp4' | 'webm';
}

const BITRATE_MAP: Record<string, number> = {
  '1080p': 2_500_000,
  '720p':  1_000_000,
  '480p':    500_000,
};

@Injectable({ providedIn: 'root' })
export class ScreenRecorderService {
  private bridge = inject(WorkerBridgeService);

  /**
   * Request display + optional audio streams from the browser.
   */
  async requestCapture(config: ScreenRecorderConfig): Promise<MediaStream> {
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 30 },
      audio: config.audioSource === 'system' || config.audioSource === 'both',
    });

    if (config.audioSource === 'none' || config.audioSource === 'system') {
      return displayStream;
    }

    const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    if (config.audioSource === 'mic') {
      return new MediaStream([
        ...displayStream.getVideoTracks(),
        ...micStream.getAudioTracks(),
      ]);
    }

    // 'both' — mix mic + system with AudioContext
    const ctx = new AudioContext();
    const dest = ctx.createMediaStreamDestination();
    if (displayStream.getAudioTracks().length) {
      ctx.createMediaStreamSource(displayStream).connect(dest);
    }
    ctx.createMediaStreamSource(micStream).connect(dest);
    return new MediaStream([...displayStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
  }

  /**
   * Build a MediaRecorder with best available codec.
   */
  buildRecorder(stream: MediaStream, resolution: string): MediaRecorder {
    const bitrate = BITRATE_MAP[resolution] ?? BITRATE_MAP['720p'];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';
    return new MediaRecorder(stream, { mimeType, videoBitsPerSecond: bitrate });
  }

  /**
   * Convert WebM blob to MP4 via FFmpeg worker.
   */
  convertToMp4(blob: Blob): Observable<WorkerMessage<ArrayBuffer>> {
    const worker = new Worker(new URL('./screen-recorder.worker', import.meta.url), { type: 'module' });
    return this.bridge.runTask(worker, { blob });
  }

  getOutputFilename(format: string): string {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    return `omni_captis_${ts}.${format}`;
  }
}