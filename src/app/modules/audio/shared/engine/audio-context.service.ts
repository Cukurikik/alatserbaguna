
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioContextService {
  private ctx: AudioContext | null = null;

  get context(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  async resume(): Promise<void> {
    if (this.ctx?.state === 'suspended') await this.ctx.resume();
  }

  createAnalyser(fftSize = 2048): AnalyserNode {
    const a = this.context.createAnalyser();
    a.fftSize = fftSize;
    return a;
  }

  createOfflineContext(channels: number, sampleRate: number, duration: number): OfflineAudioContext {
    return new OfflineAudioContext(channels, Math.ceil(sampleRate * duration), sampleRate);
  }

  close(): void {
    this.ctx?.close();
    this.ctx = null;
  }
}
