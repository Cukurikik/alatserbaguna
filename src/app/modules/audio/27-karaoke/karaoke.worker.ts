/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

self.onmessage = async (event: MessageEvent) => {
  const { file, format, outputTarget, strength } = event.data as {
    file: File; format: string; outputTarget: 'karaoke' | 'vocals'; strength: number;
  };
  try {
    self.postMessage({ type: 'progress', value: 2 });
    if (!ffmpeg) {
      ffmpeg = new FFmpeg();
      ffmpeg.on('progress', ({ progress }) => { self.postMessage({ type: 'progress', value: 10 + Math.round(progress * 82) }); });
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({ coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'), wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm') });
    }
    self.postMessage({ type: 'progress', value: 10 });

    const inputName = 'kar_in.' + file.name.split('.').pop();
    const outputName = 'kar_out.' + format;
    await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));

    const codec = format === 'mp3' ? 'libmp3lame' : (format === 'wav' ? 'pcm_s16le' : 'aac');

    let audioFilter: string;
    if (outputTarget === 'karaoke') {
      // Karaoke (vocal removal): subtract center content (vocals are centered)
      // pan filter: output = L - R (side channel only, removing mid/vocals)
      // For strength < 1: blend original with processed
      const s = strength;
      audioFilter = `pan=stereo|FL=${s.toFixed(3)}*c0-${s.toFixed(3)}*c1|FR=${s.toFixed(3)}*c1-${s.toFixed(3)}*c0`;
      self.postMessage({ type: 'log', message: `Karaoke mode: removing center vocals (strength ${(strength * 100).toFixed(0)}%)` });
    } else {
      // Vocals only: extract center / mid channel
      audioFilter = `pan=mono|c0=0.5*FL+0.5*FR`;
      self.postMessage({ type: 'log', message: 'Vocals only: extracting center (mid) channel' });
    }

    await ffmpeg.exec(['-i', inputName, '-af', audioFilter, '-c:a', codec, '-y', outputName]);

    self.postMessage({ type: 'progress', value: 95 });
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data as any], { type: `audio/${format}` });
    await ffmpeg.deleteFile(inputName); await ffmpeg.deleteFile(outputName);
    self.postMessage({ type: 'complete', data: { blob, sizeMB: blob.size / 1024 / 1024 } });
  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message || 'Karaoke processing failed', errorCode: 'FFMPEG_LOAD_FAILED' });
  }
};
