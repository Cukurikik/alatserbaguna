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
