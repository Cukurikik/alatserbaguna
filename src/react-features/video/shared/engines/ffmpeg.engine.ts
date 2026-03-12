import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export class FFmpegEngine {
  private ffmpeg: FFmpeg | null = null;
  private loaded = false;

  get isLoaded() {
    return this.loaded;
  }

  async load() {
    if (this.loaded) return;
    this.ffmpeg = new FFmpeg();
    
    // Load FFmpeg with multi-threading support if available
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    this.loaded = true;
  }

  async writeFile(name: string, data: File | Uint8Array) {
    if (!this.ffmpeg) throw new Error('FFmpeg not loaded');
    const buffer = data instanceof File ? new Uint8Array(await data.arrayBuffer()) : data;
    await this.ffmpeg.writeFile(name, buffer);
  }

  async readFile(name: string): Promise<Uint8Array> {
    if (!this.ffmpeg) throw new Error('FFmpeg not loaded');
    const data = await this.ffmpeg.readFile(name);
    return data as Uint8Array;
  }

  async deleteFile(name: string) {
    if (!this.ffmpeg) throw new Error('FFmpeg not loaded');
    await this.ffmpeg.deleteFile(name);
  }

  async run(args: string[]) {
    if (!this.ffmpeg) throw new Error('FFmpeg not loaded');
    await this.ffmpeg.exec(args);
  }

  on(event: 'progress' | 'log', callback: (data: unknown) => void) {
    if (!this.ffmpeg) return;
    if (event === 'progress') {
      this.ffmpeg.on('progress', callback);
    } else if (event === 'log') {
      this.ffmpeg.on('log', callback);
    }
  }

  off(event: 'progress' | 'log', callback: (data: unknown) => void) {
    if (!this.ffmpeg) return;
    if (event === 'progress') {
      this.ffmpeg.off('progress', callback);
    } else if (event === 'log') {
      this.ffmpeg.off('log', callback);
    }
  }
}

let engineInstance: FFmpegEngine | null = null;

export const getFFmpegEngine = () => {
  if (typeof window === 'undefined') {
    // Return a dummy or throw error if accessed on server
    // For now, return the instance which will likely fail if methods are called,
    // but we shouldn't call them on server anyway.
    if (!engineInstance) engineInstance = new FFmpegEngine();
    return engineInstance;
  }
  
  if (!engineInstance) {
    engineInstance = new FFmpegEngine();
  }
  return engineInstance;
};

// Keep the old export for compatibility but make it a getter if possible, 
// or just export the getter.
export const ffmpegEngine = typeof window !== 'undefined' ? new FFmpegEngine() : {} as FFmpegEngine;
