import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage } from '../shared/types/video.types';
import { TrimmerInput } from './trimmer.schema';

@Injectable({
  providedIn: 'root'
})
export class TrimmerService {
  private workerBridge = inject(WorkerBridgeService);

  process(config: TrimmerInput): Observable<WorkerMessage<Uint8Array>> {
    return this.workerBridge.process<TrimmerInput, Uint8Array>(
      () => new Worker(new URL('./trimmer.worker', import.meta.url), { type: 'module' }),
      config
    );
  }
}
