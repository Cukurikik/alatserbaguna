import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { VideoMeta, WorkerMessage } from '../shared/types/video.types';

export interface MetadataFields {
  title?: string;
  artist?: string;
  album?: string;
  year?: string;
  description?: string;
  comment?: string;
  genre?: string;
}

export interface MetadataEditorConfig {
  file: File;
  editedFields: MetadataFields;
  stripAll: boolean;
}

@Injectable({ providedIn: 'root' })
export class MetadataEditorService {
  private bridge = inject(WorkerBridgeService);

  /**
   * Registry Engine processor.
   */
  process(config: MetadataEditorConfig): Observable<WorkerMessage<ArrayBuffer>> {
    const worker = new Worker(new URL('./metadata-editor.worker', import.meta.url), { type: 'module' });
    return this.bridge.runTask(worker, config);
  }

  getOutputFilename(originalName: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_tagged_${base}.mp4`;
  }
}