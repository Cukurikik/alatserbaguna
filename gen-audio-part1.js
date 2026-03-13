const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, 'src/app/modules/audio');

function write(relPath, content) {
  const full = path.join(BASE, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  console.log('✅ Written:', relPath);
}

// ─── shared/types/audio.types.ts ─────────────────────────────────────────────
write('shared/types/audio.types.ts', `
export type ExportFormat = 'wav' | 'mp3' | 'aac' | 'ogg' | 'flac' | 'opus' | 'm4a';

export type ProcessingStatus =
  | 'idle' | 'loading' | 'processing' | 'rendering' | 'done' | 'error';

export type AudioErrorCode =
  | 'FILE_TOO_LARGE' | 'INVALID_FILE_TYPE' | 'FILE_CORRUPTED'
  | 'AUDIO_CONTEXT_FAILED' | 'DECODE_FAILED' | 'ENCODE_FAILED'
  | 'FFMPEG_LOAD_FAILED' | 'FFMPEG_TIMEOUT' | 'WORKER_CRASHED'
  | 'ONNX_LOAD_FAILED' | 'MODEL_DOWNLOAD_FAILED' | 'INSUFFICIENT_MEMORY'
  | 'MIC_PERMISSION_DENIED' | 'NO_AUDIO_STREAM' | 'INVALID_PARAMS' | 'UNKNOWN_ERROR';

export interface AudioMeta {
  filename: string;
  fileSizeMB: number;
  duration: number;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  bitrate: number;
  codec: string;
  hasVideo: boolean;
}

export interface WaveformData {
  peaks: Float32Array;
  duration: number;
  sampleRate: number;
}

export interface WorkerMessage<T = unknown> {
  type: 'progress' | 'complete' | 'error' | 'log';
  value?: number;
  data?: T;
  message?: string;
  errorCode?: AudioErrorCode;
}

export interface AudioChunk {
  buffer: AudioBuffer;
  startTime: number;
  endTime: number;
  channelData: Float32Array[];
}
`.trimStart());

// ─── shared/errors/audio.errors.ts ───────────────────────────────────────────
write('shared/errors/audio.errors.ts', `
import { AudioErrorCode } from '../types/audio.types';

export const AUDIO_ERROR_MESSAGES: Record<AudioErrorCode, string> = {
  FILE_TOO_LARGE: 'File exceeds the 500 MB limit. Please use a smaller file.',
  INVALID_FILE_TYPE: 'Unsupported file type. Please use MP3, WAV, FLAC, OGG, M4A, or OPUS.',
  FILE_CORRUPTED: 'The file appears to be corrupted or unreadable.',
  AUDIO_CONTEXT_FAILED: 'Failed to initialize the Web Audio engine.',
  DECODE_FAILED: 'Failed to decode the audio file. The file may be corrupted.',
  ENCODE_FAILED: 'Failed to encode the output audio.',
  FFMPEG_LOAD_FAILED: 'Failed to load the FFmpeg audio engine.',
  FFMPEG_TIMEOUT: 'Processing timed out. Try a shorter audio file.',
  WORKER_CRASHED: 'The audio processing worker crashed unexpectedly.',
  ONNX_LOAD_FAILED: 'Failed to load the AI model.',
  MODEL_DOWNLOAD_FAILED: 'Failed to download the AI model. Check your connection.',
  INSUFFICIENT_MEMORY: 'Not enough memory to process this file.',
  MIC_PERMISSION_DENIED: 'Microphone access was denied. Please allow microphone access.',
  NO_AUDIO_STREAM: 'No audio stream found in the file.',
  INVALID_PARAMS: 'Invalid processing parameters.',
  UNKNOWN_ERROR: 'An unknown error occurred.',
};
`.trimStart());

// ─── shared/schemas/audio.schemas.ts ─────────────────────────────────────────
write('shared/schemas/audio.schemas.ts', `
import { z } from 'zod';

export const AudioFileSchema = z.instanceof(File).refine(
  (f) => f.size <= 500 * 1024 * 1024,
  { message: 'File must be under 500 MB' }
).refine(
  (f) => /\\.(mp3|wav|flac|ogg|m4a|opus|aac|webm|mp4|mov|avi)$/i.test(f.name),
  { message: 'Unsupported file type' }
);

export const ExportFormatSchema = z.enum(['wav', 'mp3', 'aac', 'ogg', 'flac', 'opus', 'm4a']);
`.trimStart());

// ─── shared/engine/audio-context.service.ts ──────────────────────────────────
write('shared/engine/audio-context.service.ts', `
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
`.trimStart());

// ─── shared/engine/offline-renderer.service.ts ───────────────────────────────
write('shared/engine/offline-renderer.service.ts', `
import { Injectable } from '@angular/core';
import { FfmpegAudioService } from './ffmpeg-audio.service';
import { ExportFormat } from '../types/audio.types';

@Injectable({ providedIn: 'root' })
export class OfflineRendererService {
  constructor(private ffmpeg: FfmpegAudioService) {}

  async decodeFile(file: File): Promise<AudioBuffer> {
    const ab = await file.arrayBuffer();
    const ctx = new AudioContext();
    const buf = await ctx.decodeAudioData(ab);
    ctx.close();
    return buf;
  }

  async render(buffer: AudioBuffer, buildChain: (ctx: OfflineAudioContext) => AudioNode): Promise<AudioBuffer> {
    const offline = new OfflineAudioContext(
      buffer.numberOfChannels, buffer.length, buffer.sampleRate
    );
    const source = offline.createBufferSource();
    source.buffer = buffer;
    const lastNode = buildChain(offline);
    source.connect(lastNode);
    lastNode.connect(offline.destination);
    source.start(0);
    return offline.startRendering();
  }

  encodeToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const numSamples = buffer.length;
    const bytesPerSample = 2;
    const dataSize = numChannels * numSamples * bytesPerSample;
    const ab = new ArrayBuffer(44 + dataSize);
    const view = new DataView(ab);
    const writeStr = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
    writeStr(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true);
    writeStr(8, 'WAVE'); writeStr(12, 'fmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true); view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
    view.setUint16(32, numChannels * bytesPerSample, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data'); view.setUint32(40, dataSize, true);
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const s = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        offset += 2;
      }
    }
    return new Blob([ab], { type: 'audio/wav' });
  }

  async encodeToFormat(buffer: AudioBuffer, format: ExportFormat, onProgress: (p: number) => void): Promise<Blob> {
    if (format === 'wav') return this.encodeToWav(buffer);
    const wavBlob = this.encodeToWav(buffer);
    const wavFile = new File([wavBlob], 'temp.wav', { type: 'audio/wav' });
    return this.ffmpeg.processAudio(wavFile, format, ['-i', '{in}', '{out}'], onProgress);
  }
}
`.trimStart());

// ─── shared/engine/onnx-audio.service.ts ─────────────────────────────────────
write('shared/engine/onnx-audio.service.ts', `
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OnnxAudioService {
  private sessions = new Map<string, any>();
  private downloadProgress = signal<number>(0);

  getDownloadProgress() { return this.downloadProgress.asReadonly(); }
  isModelLoaded(name: string) { return this.sessions.has(name); }

  async loadModel(modelName: string, modelUrl: string): Promise<any> {
    if (this.sessions.has(modelName)) return this.sessions.get(modelName);
    try {
      const ort = (window as any).ort;
      if (!ort) throw new Error('ONNX Runtime not loaded. Add onnxruntime-web to your HTML.');
      const resp = await fetch(modelUrl);
      if (!resp.ok) throw new Error('Model download failed: ' + resp.status);
      const total = Number(resp.headers.get('content-length') || 0);
      const reader = resp.body!.getReader();
      const chunks: Uint8Array[] = [];
      let loaded = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.byteLength;
        if (total > 0) this.downloadProgress.set(Math.round(loaded / total * 100));
      }
      const modelData = new Uint8Array(loaded);
      let pos = 0;
      for (const chunk of chunks) { modelData.set(chunk, pos); pos += chunk.byteLength; }
      const session = await ort.InferenceSession.create(modelData);
      this.sessions.set(modelName, session);
      return session;
    } catch (e) {
      throw new Error('ONNX_LOAD_FAILED: ' + (e as Error).message);
    }
  }
}
`.trimStart());

// ─── shared/engine/worker-bridge.service.ts ──────────────────────────────────
write('shared/engine/worker-bridge.service.ts', `
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerMessage } from '../types/audio.types';

@Injectable({ providedIn: 'root' })
export class WorkerBridgeService {
  process<TInput, TOutput>(
    workerFactory: () => Worker,
    data: TInput
  ): Observable<WorkerMessage<TOutput>> {
    return new Observable(obs => {
      const worker = workerFactory();
      worker.onmessage = (e: MessageEvent<WorkerMessage<TOutput>>) => {
        obs.next(e.data);
        if (e.data.type === 'complete' || e.data.type === 'error') {
          obs.complete();
        }
      };
      worker.onerror = (err) => {
        obs.next({ type: 'error', message: err.message, errorCode: 'WORKER_CRASHED' });
        obs.complete();
      };
      worker.postMessage(data);
      return () => worker.terminate();
    });
  }
}
`.trimStart());

// ─── Update shared/index.ts ───────────────────────────────────────────────────
write('shared/index.ts', `
export * from './types/audio.types';
export * from './errors/audio.errors';
export * from './schemas/audio.schemas';
export { AudioContextService } from './engine/audio-context.service';
export { OfflineRendererService } from './engine/offline-renderer.service';
export { FfmpegAudioService } from './engine/ffmpeg-audio.service';
export { OnnxAudioService } from './engine/onnx-audio.service';
export { WorkerBridgeService } from './engine/worker-bridge.service';
`.trimStart());

console.log('\n✅ PART 1 COMPLETE: Shared engine layer written.\n');
