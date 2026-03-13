import { Injectable } from '@angular/core';
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
  constructor(private bridge: WorkerBridgeService) {}

  /** Check if WebGPU is available in the current browser. */
  async checkWebGPU(): Promise<boolean> {
    if (!('gpu' in navigator)) return false;
    try {
      // Cast: navigator.gpu is unknown without @webgpu/types — safe after 'gpu' in navigator check
      const gpu = (navigator as Navigator & { gpu: { requestAdapter(): Promise<object | null> } }).gpu;
      const adapter = await gpu.requestAdapter();
      return adapter !== null;
    } catch {
      return false;
    }
  }

  /**
   * Estimate remaining processing time based on frames left and average frame time.
   * Returns a human-readable string like "~3m 42s remaining".
   */
  estimateTimeRemaining(framesLeft: number, avgFrameTimeMs: number): string {
    const totalSeconds = Math.round((framesLeft * avgFrameTimeMs) / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins === 0) return `~${secs}s remaining`;
    return `~${mins}m ${secs}s remaining`;
  }

  /**
   * Get the ONNX model URL for download (shown only on first use).
   * After download, model is cached in OPFS — checked by the worker.
   */
  getModelUrl(model: UpscaleModel, scaleFactor: 2 | 4): string {
    return MODEL_URLS[model][scaleFactor];
  }

  /**
   * Get worker pool size: navigator.hardwareConcurrency capped at 4.
   * Multi-frame parallelism for non-WebGPU fallback.
   */
  getWorkerPoolSize(): number {
    return Math.min(navigator.hardwareConcurrency || 2, 4);
  }

  process(config: UpscalerConfig): Observable<WorkerMessage<ArrayBuffer>> {
    return this.bridge.runTask(new Worker(new URL('./upscaler.worker', import.meta.url), { type: 'module' }), config);
  }

  getOutputFilename(originalName: string, scaleFactor: number): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_upscaled_${scaleFactor}x_${base}.mp4`;
  }
}