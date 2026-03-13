import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage } from '../shared/types/video.types';

export interface AudioExtractorConfig {
  file: File;
  outputFormat: 'wav' | 'mp3' | 'aac' | 'ogg' | 'flac';
  bitrate: 128 | 192 | 256 | 320;
  videoDuration: number;
}

@Injectable({ providedIn: 'root' })
export class AudioExtractorService {
  private bridge = inject(WorkerBridgeService);

  /**
   * Acoustic Engine processor.
   */
  process(config: AudioExtractorConfig): Observable<WorkerMessage<ArrayBuffer>> {
    const worker = new Worker(new URL('./audio-extractor.worker', import.meta.url), { type: 'module' });
    return this.bridge.runTask(worker, config);
  }

  getOutputFilename(originalName: string, format: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_acoustic_${base}.${format}`;
  }
}