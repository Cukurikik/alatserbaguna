import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage } from '../shared/types/video.types';

export interface ThumbnailConfig {
  file: File;
  mode: 'single' | 'grid' | 'interval';
  timestamp?: number;
  gridCols?: number;
  gridRows?: number;
  intervalSeconds?: number;
  imageFormat: 'jpg' | 'png' | 'webp';
  jpgQuality: number;
  videoDuration: number;
}

@Injectable({ providedIn: 'root' })
export class ThumbnailGeneratorService {
  private bridge = inject(WorkerBridgeService);

  /**
   * Snapshot frame extraction processor.
   */
  process(config: ThumbnailConfig): Observable<WorkerMessage<ArrayBuffer[]>> {
    const worker = new Worker(new URL('./thumbnail-generator.worker', import.meta.url), { type: 'module' });
    return this.bridge.runTask(worker, config);
  }

  getOutputFilename(originalName: string, index: number, format: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_snapshot_${base}_${index + 1}.${format}`;
  }
}