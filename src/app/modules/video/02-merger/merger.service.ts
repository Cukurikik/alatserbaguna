import { Injectable, inject } from '@angular/core';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MergerService {
  private workerBridge = inject(WorkerBridgeService);

  process(files: File[], outputFormat: string): Observable<any> {
    const worker = new Worker(new URL('./merger.worker', import.meta.url), { type: 'module' });
    return this.workerBridge.runTask(worker, { files, outputFormat });
  }
}