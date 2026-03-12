import { Injectable } from '@angular/core';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

@Injectable({
  providedIn: 'root'
})
export class FFmpegEngineService {
  private ffmpeg = new FFmpeg();
  private loaded = false;

  async load() {
    if (this.loaded) return;

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    this.loaded = true;
  }

  async writeFile(name: string, data: string | Uint8Array) {
    await this.ffmpeg.writeFile(name, data);
  }

  async readFile(name: string) {
    return await this.ffmpeg.readFile(name);
  }

  async exec(args: string[]) {
    return await this.ffmpeg.exec(args);
  }

  isLoaded() {
    return this.loaded;
  }
}
