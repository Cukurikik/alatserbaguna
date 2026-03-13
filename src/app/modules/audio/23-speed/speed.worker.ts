/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

function buildAtempoChain(speed: number): string {
  // atempo only accepts 0.5-2.0 per instance, so chain if needed
  if (speed >= 0.5 && speed <= 2.0) return `atempo=${speed}`;
  if (speed > 2.0) {
    const parts: string[] = [];
    let remaining = speed;
    while (remaining > 2.0) { parts.push('atempo=2.0'); remaining /= 2.0; }
    parts.push(`atempo=${remaining.toFixed(4)}`);
    return parts.join(',');
  }
  // speed < 0.5
  const parts: string[] = [];
  let remaining = speed;
  while (remaining < 0.5) { parts.push('atempo=0.5'); remaining /= 0.5; }
  parts.push(`atempo=${remaining.toFixed(4)}`);
  return parts.join(',');
}

self.onmessage = async (event: MessageEvent) => {
  const { file, format, speed, pitchLock } = event.data as { file: File; format: string; speed: number; pitchLock: boolean };
  try {
    self.postMessage({ type: 'progress', value: 2 });
    if (!ffmpeg) {
      ffmpeg = new FFmpeg();
      ffmpeg.on('progress', ({ progress }) => { self.postMessage({ type: 'progress', value: 10 + Math.round(progress * 82) }); });
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({ coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'), wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm') });
    }
    self.postMessage({ type: 'progress', value: 10 });

    const inputName = 'spd_in.' + file.name.split('.').pop();
    const outputName = 'spd_out.' + format;
    await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));
    const codec = format === 'mp3' ? 'libmp3lame' : (format === 'wav' ? 'pcm_s16le' : 'aac');

    let audioFilter: string;
    if (pitchLock) {
      // atempo preserves pitch
      audioFilter = buildAtempoChain(speed);
    } else {
      // asetrate changes speed + pitch (raw playback rate)
      // Then we resample back to original rate to get correct duration at altered pitch
      audioFilter = `asetrate=44100*${speed},aresample=44100`;
    }

    self.postMessage({ type: 'log', message: `Speed: ${speed}x, Pitch Lock: ${pitchLock}, Filter: ${audioFilter}` });
    await ffmpeg.exec(['-i', inputName, '-af', audioFilter, '-c:a', codec, '-y', outputName]);

    self.postMessage({ type: 'progress', value: 95 });
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data], { type: `audio/${format}` });
    await ffmpeg.deleteFile(inputName); await ffmpeg.deleteFile(outputName);
    self.postMessage({ type: 'complete', data: { blob, sizeMB: blob.size / 1024 / 1024 } });
  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message || 'Speed change failed', errorCode: 'FFMPEG_LOAD_FAILED' });
  }
};
