import { Injectable, signal } from '@angular/core';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { ExportFormat } from '../types/audio.types';

@Injectable({ providedIn: 'root' })
export class FfmpegAudioService {
  private ffmpeg = new FFmpeg();
  private loaded = false;
  
  readonly isReady = signal(false);

  constructor() {
    this.ffmpeg.on('log', ({ message }) => console.log('[FFmpeg]', message));
  }

  async load(): Promise<void> {
    if (this.loaded) return;
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    this.loaded = true;
    this.isReady.set(true);
  }

  async processAudio(
    inputFile: File, 
    format: ExportFormat, 
    ffmpegArgs: string[], 
    onProgress: (p: number) => void
  ): Promise<Blob> {
    await this.load();
    const inName = 'input_' + Date.now() + this.getExt(inputFile.name);
    const outName = 'output_' + Date.now() + '.' + format;
    
    const progressHandler = ({ progress }: any) => {
      onProgress(Math.min(100, Math.round(progress * 100)));
    };
    this.ffmpeg.on('progress', progressHandler);
    
    await this.ffmpeg.writeFile(inName, await fetchFile(inputFile));
    
    // Replace {in} and {out} with actual filenames
    const args = ffmpegArgs.map(a => a === '{in}' ? inName : a === '{out}' ? outName : a);
    if (!args.includes(outName)) args.push(outName); // default output placement

    try {
      await this.ffmpeg.exec(args);
      const data = await this.ffmpeg.readFile(outName);
      return new Blob([(data as Uint8Array).buffer as ArrayBuffer], { type: `audio/${format}` });
    } finally {
      this.ffmpeg.off('progress', progressHandler);
      try { await this.ffmpeg.deleteFile(inName); } catch (e) {}
      try { await this.ffmpeg.deleteFile(outName); } catch (e) {}
    }
  }

  getOutputFilename(original: string, format: string, op: string): string {
    const base = original.replace(/\.[^.]+$/, '');
    return `omni_${op}_${base}.${format}`;
  }

  private getExt(filename: string) {
    const match = filename.match(/\.[^.]+$/);
    return match ? match[0] : '.mp3';
  }
}
