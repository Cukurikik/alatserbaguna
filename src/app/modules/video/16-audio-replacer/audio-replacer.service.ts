import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage, VideoMeta } from '../shared/types/video.types';

export interface AudioReplacerConfig {
  videoFile: File;
  audioFile: File;
  mode: 'replace' | 'mix';
  originalVolume: number;
  newAudioVolume: number;
  loopAudio: boolean;
  videoMeta: VideoMeta;
}

@Injectable({ providedIn: 'root' })
export class AudioReplacerService {
  private bridge = inject(WorkerBridgeService);

  /**
   * Sync Engine processor.
   */
  process(config: AudioReplacerConfig): Observable<WorkerMessage<ArrayBuffer>> {
    const worker = new Worker(new URL('./audio-replacer.worker', import.meta.url), { type: 'module' });
    return this.bridge.runTask(worker, config);
  }

  getOutputFilename(originalName: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_synced_${base}.mp4`;
  }
}