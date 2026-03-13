import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage } from '../shared/types/video.types';

export interface ClipDef { path: string; duration: number; }
export interface TransitionDef { type: string; duration: number; }

export interface TransitionsConfig {
  clips: File[];
  transitions: TransitionDef[];
}

@Injectable({ providedIn: 'root' })
export class TransitionsService {
  private bridge = inject(WorkerBridgeService);

  /**
   * Flux Engine processor.
   */
  process(config: TransitionsConfig): Observable<WorkerMessage<ArrayBuffer>> {
    const worker = new Worker(new URL('./transitions.worker', import.meta.url), { type: 'module' });
    return this.bridge.runTask(worker, config);
  }

  getOutputFilename(originalName: string = 'sequence'): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_flux_${base}.mp4`;
  }
}