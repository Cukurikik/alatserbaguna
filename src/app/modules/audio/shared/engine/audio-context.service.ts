import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioContextService {
  private ctx: AudioContext | null = null;
  readonly state = signal<'suspended' | 'running' | 'closed'>('suspended');

  async resume(): Promise<AudioContext> {
    if (!this.ctx) {
      this.ctx = new AudioContext({ sampleRate: 48000 });
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this.state.set(this.ctx.state as any);
    return this.ctx;
  }

  get context(): AudioContext | null { return this.ctx; }

  createAnalyser(fftSize = 2048): AnalyserNode {
    if (!this.ctx) throw new Error('AudioContext not initialized');
    const node = this.ctx.createAnalyser();
    node.fftSize = fftSize;
    node.smoothingTimeConstant = 0.8;
    return node;
  }

  createOfflineContext(channels: number, sampleRate: number, durationSec: number): OfflineAudioContext {
    return new OfflineAudioContext(channels, Math.ceil(sampleRate * durationSec), sampleRate);
  }

  async decodeArrayBuffer(ab: ArrayBuffer): Promise<AudioBuffer> {
    const ctx = await this.resume();
    return ctx.decodeAudioData(ab);
  }

  async decodeFile(file: File): Promise<AudioBuffer> {
    const ab = await file.arrayBuffer();
    return this.decodeArrayBuffer(ab);
  }

  close(): void {
    this.ctx?.close();
    this.ctx = null;
    this.state.set('closed');
  }
}
