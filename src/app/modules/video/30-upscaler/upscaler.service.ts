import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage } from '../shared/types/video.types';

export type UpscaleModel = 'realesrgan' | 'esrgan' | 'swinir';

export interface UpscalerConfig {
  file: File;
  scaleFactor: 2 | 4;
  model: UpscaleModel;
  fps: number;
}

const MODEL_URLS: Record<UpscaleModel, Record<2 | 4, string>> = {
  realesrgan: {
    2: 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-general-x4v3.pth',
    4: 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/RealESRGAN_x4plus.pth',
  },
  esrgan: {
    2: 'https://github.com/xinntao/ESRGAN/releases/download/v0.1/RRDB_ESRGAN_x4.pth',
    4: 'https://github.com/xinntao/ESRGAN/releases/download/v0.1/RRDB_ESRGAN_x4.pth',
  },
  swinir: {
    2: 'https://github.com/JingyunLiang/SwinIR/releases/download/v0.0/003_realSR_BSRGAN_DFOWMFC_s64w8_SwinIR-L_x4_GAN.pth',
    4: 'https://github.com/JingyunLiang/SwinIR/releases/download/v0.0/003_realSR_BSRGAN_DFOWMFC_s64w8_SwinIR-L_x4_GAN.pth',
  },
};

@Injectable({ providedIn: 'root' })
export class UpscalerService {
  private readonly bridge = inject(WorkerBridgeService);

  /**
   * Nova Engine processor.
   */
  async checkWebGPU(): Promise<boolean> {
    if (!('gpu' in navigator)) return false;
    try {
      const gpu = (navigator as Navigator & { gpu: { requestAdapter(): Promise<object | null> } }).gpu;
      const adapter = await gpu.requestAdapter();
      return adapter !== null;
    } catch {
      return false;
    }
  }

  estimateTimeRemaining(framesLeft: number, avgFrameTimeMs: number): string {
    const totalSeconds = Math.round((framesLeft * avgFrameTimeMs) / 1000);
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
  }

  getModelUrl(model: UpscaleModel, scaleFactor: 2 | 4): string {
    return MODEL_URLS[model][scaleFactor];
  }

  getWorkerPoolSize(): number {
    return Math.min(navigator.hardwareConcurrency || 2, 4);
  }

  process(config: UpscalerConfig): Observable<WorkerMessage<ArrayBuffer>> {
    const worker = new Worker(new URL('./upscaler.worker', import.meta.url), { type: 'module' });
    return this.bridge.runTask(worker, config);
  }

  getOutputFilename(originalName: string, scaleFactor: number): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_nova_${scaleFactor}x_${base}.mp4`;
  }
}