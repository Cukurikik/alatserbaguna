import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage } from '../shared/types/video.types';

export interface SlideshowConfig {
  images: File[];
  defaultDuration: number;
  kenBurns: boolean;
  perImageDuration?: number[];
  musicFile?: File;
  musicVolume?: number;
  loopMusic?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SlideshowService {
  constructor(private bridge: WorkerBridgeService) {}

  /**
   * Build the FFmpeg zoompan filter for Ken Burns effect.
   * Zooms from 1.0 to 1.5× over the image duration.
   * Maintains center crop during zoom.
   */
  buildZoompanFilter(durationSeconds: number, fps = 30): string {
    const totalFrames = Math.round(durationSeconds * fps);
    return [
      `zoompan=z='min(zoom+0.0015,1.5)'`,
      `d=${totalFrames}`,
      `x='iw/2-(iw/zoom/2)'`,
      `y='ih/2-(ih/zoom/2)'`,
      `s=1920x1080`,
    ].join(':');
  }

  /**
   * Build FFmpeg args to create a video clip from a single image.
   * Used sequentially — one image at a time — to build the slide clips.
   */
  buildImageVideoClipArgs(imagePath: string, durationSeconds: number): string[] {
    return [
      '-loop', '1',
      '-i', imagePath,
      '-t', String(durationSeconds),
      '-r', '30',
      '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-pix_fmt', 'yuv420p',
    ];
  }

  process(config: SlideshowConfig): Observable<WorkerMessage<ArrayBuffer>> {
    return this.bridge.process<SlideshowConfig, ArrayBuffer>(
      () => new Worker(new URL('./slideshow.worker', import.meta.url), { type: 'module' }),
      config
    );
  }

  getOutputFilename(): string {
    return `omni_slideshow_${Date.now()}.mp4`;
  }
}