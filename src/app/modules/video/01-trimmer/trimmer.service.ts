import { Injectable, inject } from '@angular/core';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TrimmerService {
  private workerBridge = inject(WorkerBridgeService);

  process(config: any): Observable<any> {
    const worker = new Worker(new URL('./trimmer.worker', import.meta.url), { type: 'module' });
    return this.workerBridge.runTask(worker, config);
  }
}