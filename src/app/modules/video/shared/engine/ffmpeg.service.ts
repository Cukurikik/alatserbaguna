import { Injectable, signal, Signal } from '@angular/core';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { VideoMeta } from '../types/video.types';
import { getVideoError } from '../errors/video.errors';

@Injectable({
  providedIn: 'root'
})
export class FFmpegService {
  private ffmpeg: FFmpeg | null = null;
  private _isLoaded = signal(false);
  private _isLoading = signal(false);

  async load(): Promise<void> {
    if (this._isLoaded()) return;
    
    this._isLoading.set(true);
    try {
      this.ffmpeg = new FFmpeg();
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      this._isLoaded.set(true);
    } catch {
      throw getVideoError('FFMPEG_LOAD_FAILED');
    } finally {
      this._isLoading.set(false);
    }
  }

  async getMetadata(file: File): Promise<VideoMeta> {
    await this.load();
    if (!this.ffmpeg) throw getVideoError('FFMPEG_LOAD_FAILED');

    const fileName = 'input_meta' + file.name.substring(file.name.lastIndexOf('.'));
    await this.ffmpeg.writeFile(fileName, await fetchFile(file));

    let output = '';
    const onLog = ({ message }: { message: string }) => {
      output += message + '\n';
    };
    this.ffmpeg.on('log', onLog);

    try {
      // Run ffprobe equivalent (ffmpeg -i)
      await this.ffmpeg.exec(['-i', fileName]);
    } catch {
      // ffmpeg -i returns non-zero if no output file is specified, which is expected
    }

    this.ffmpeg.off('log', onLog);
    await this.deleteFile(fileName);

    // Parse output to extract metadata
    const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
    let duration = 0;
    if (durationMatch) {
      duration = parseInt(durationMatch[1]) * 3600 + parseInt(durationMatch[2]) * 60 + parseFloat(durationMatch[3]);
    }

    const videoMatch = output.match(/Stream #.*: Video: (.*?), .*?, (\d+)x(\d+)/);
    const fpsMatch = output.match(/([\d.]+) fps/);
    const audioMatch = output.match(/Stream #.*: Audio: (.*?),/);

    return {
      filename: file.name,
      fileSizeMB: file.size / (1024 * 1024),
      duration,
      width: videoMatch ? parseInt(videoMatch[2]) : 0,
      height: videoMatch ? parseInt(videoMatch[3]) : 0,
      fps: fpsMatch ? parseFloat(fpsMatch[1]) : 0,
      codec: videoMatch ? videoMatch[1].split(' ')[0] : '',
      audioCodec: audioMatch ? audioMatch[1].split(' ')[0] : null,
      audioBitrate: 0,
      videoBitrate: 0,
      hasAudio: !!audioMatch,
      aspectRatio: videoMatch ? `${videoMatch[2]}:${videoMatch[3]}` : '16:9'
    };
  }

  async runCommand(args: string[], onProgress?: (p: number) => void): Promise<Uint8Array> {
    await this.load();
    if (!this.ffmpeg) throw getVideoError('FFMPEG_LOAD_FAILED');

    const progressCallback = ({ progress }: { progress: number }) => {
      if (onProgress) {
        onProgress(Math.round(progress * 100));
      }
    };

    if (onProgress) {
      this.ffmpeg.on('progress', progressCallback);
    }

    const code = await this.ffmpeg.exec(args);
    
    if (onProgress) {
      this.ffmpeg.off('progress', progressCallback);
    }

    if (code !== 0) {
      throw getVideoError('FFMPEG_COMMAND_FAILED');
    }

    // Assuming the last argument is the output file name
    const outputFile = args[args.length - 1];
    const data = await this.ffmpeg.readFile(outputFile);
    return data as Uint8Array;
  }

  async deleteFile(name: string): Promise<void> {
    if (!this.ffmpeg) return;
    try {
      await this.ffmpeg.deleteFile(name);
    } catch (e) {
      console.warn(`Failed to delete file ${name} from WASM FS`, e);
    }
  }

  isReady(): Signal<boolean> {
    return this._isLoaded;
  }
}

