import { Injectable, inject } from '@angular/core';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ColorGradingService {
  private bridge = inject(WorkerBridgeService);
  process(payload: object): Observable<any> {
    const worker = new Worker(new URL('./color-grading.worker', import.meta.url), { type: 'module' });
    return this.bridge.runTask(worker, payload);
  }
}