import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkerBridgeService {
  private worker: Worker | null = null;
  private messageSubject = new Subject<any>();

  initWorker(scriptPath: string): void {
    if (this.worker) {
      this.worker.terminate();
    }
    // E.g. new Worker(new URL('./app.worker', import.meta.url), { type: 'module' });
    this.worker = new Worker(new URL(scriptPath, import.meta.url), { type: 'module' });
    
    this.worker.onmessage = ({ data }) => {
      this.messageSubject.next(data);
    };
    
    this.worker.onerror = (error) => {
      this.messageSubject.error(error);
    };
  }

  postMessage(message: any, transfer: Transferable[] = []): void {
    if (this.worker) {
      this.worker.postMessage(message, transfer);
    }
  }

  getMessages(): Observable<any> {
    return this.messageSubject.asObservable();
  }

  terminateWorker(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  runTask(worker: Worker, config: any): Observable<any> {
    return new Observable(observer => {
      worker.onmessage = ({ data }) => {
        if (data.type === 'progress') {
          observer.next(data);
        } else if (data.type === 'complete' || data.type === 'done') {
          observer.next(data);
          observer.complete();
          worker.terminate();
        } else if (data.type === 'error') {
          observer.error(data);
          worker.terminate();
        }
      };
      
      worker.onerror = (error) => {
        observer.error(error);
        worker.terminate();
      };
      
      worker.postMessage({ type: 'start', config });
      
      return () => {
        worker.terminate();
      };
    });
  }
}
