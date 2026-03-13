import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage } from '../shared/types/video.types';

export type CompareMode = 'sidebyside' | 'divider' | 'difference';

export interface CompareConfig {
  fileA: File;
  fileB: File;
  mode: CompareMode;
}

@Injectable({ providedIn: 'root' })
export class CompareService {
  constructor(private bridge: WorkerBridgeService) {}

  /**
   * Sync playback between two video elements (A drives B).
   * Sets up play/pause/seek listeners so both stay in sync.
   */
  syncPlayback(videoA: HTMLVideoElement, videoB: HTMLVideoElement): () => void {
    const onPlay = () => { void videoB.play(); };
    const onPause = () => videoB.pause();
    const onSeeked = () => { videoB.currentTime = videoA.currentTime; };

    videoA.addEventListener('play', onPlay);
    videoA.addEventListener('pause', onPause);
    videoA.addEventListener('seeked', onSeeked);

    // Return cleanup function
    return () => {
      videoA.removeEventListener('play', onPlay);
      videoA.removeEventListener('pause', onPause);
      videoA.removeEventListener('seeked', onSeeked);
    };
  }

  /**
   * Compute per-pixel absolute difference between two canvas contexts.
   * Amplifies differences by 3× for visibility.
   */
  computeDifference(
    ctxA: CanvasRenderingContext2D,
    ctxB: CanvasRenderingContext2D,
    outputCtx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    const dataA = ctxA.getImageData(0, 0, width, height);
    const dataB = ctxB.getImageData(0, 0, width, height);
    const out = outputCtx.createImageData(width, height);

    for (let i = 0; i < dataA.data.length; i += 4) {
      out.data[i]     = Math.min(255, Math.abs(dataA.data[i]     - dataB.data[i])     * 3);
      out.data[i + 1] = Math.min(255, Math.abs(dataA.data[i + 1] - dataB.data[i + 1]) * 3);
      out.data[i + 2] = Math.min(255, Math.abs(dataA.data[i + 2] - dataB.data[i + 2]) * 3);
      out.data[i + 3] = 255;
    }
    outputCtx.putImageData(out, 0, 0);
  }

  /** Export side-by-side or difference mode via FFmpeg hstack/blend filter. */
  export(config: CompareConfig): Observable<WorkerMessage<ArrayBuffer>> {
    return this.bridge.runTask(new Worker(new URL('./compare.worker', import.meta.url), { type: 'module' }), config);
  }
}