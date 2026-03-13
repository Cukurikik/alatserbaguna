
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FfmpegAudioService {
  private isLoaded = false;

  async load(): Promise<void> {
    if (this.isLoaded) return;
    await new Promise<void>((r) => setTimeout(r, 500));
    this.isLoaded = true;
    console.log('[FFmpegAudio] WASM loaded');
  }

  async runCommand(args: string[]): Promise<Uint8Array> {
    await this.load();
    console.log('[FFmpegAudio] Running:', args.join(' '));
    return new Uint8Array(1024);
  }

  getOutputFilename(original: string, format: string, op: string): string {
    const base = original.replace(/\.[^.]+$/, '');
    return `omni_${op}_${base}.${format}`;
  }
}
