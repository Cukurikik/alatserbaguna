/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

self.onmessage = async (event: MessageEvent) => {
  const { file, format, ceiling, lookaheadMs, release, targetLUFS, truePeak } = event.data as {
    file: File; format: string; ceiling: number; lookaheadMs: number; release: number; targetLUFS: number | null; truePeak: boolean;
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

    const inputName = 'lim_in.' + file.name.split('.').pop();
    const outputName = 'lim_out.' + format;
    await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));

    const ceilingLinear = Math.pow(10, ceiling / 20); // dBFS → linear
    const filters: string[] = [];

    // Step 1: Loudness normalization to target LUFS (if set)
    if (targetLUFS !== null) {
      filters.push(`loudnorm=I=${targetLUFS}:LRA=11:TP=${ceiling}`);
      self.postMessage({ type: 'log', message: `Loudness target: ${targetLUFS} LUFS` });
    }

    // Step 2: Brick-wall limiter via alimiter filter
    const lookaheadSamples = Math.round((lookaheadMs / 1000) * 44100);
    filters.push(`alimiter=level_in=1:level_out=${ceilingLinear.toFixed(6)}:limit=${ceilingLinear.toFixed(6)}:attack=${lookaheadMs || 1}:release=${Math.round(release * 1000)}:level=disabled`);
    self.postMessage({ type: 'log', message: `Limiter: ceiling ${ceiling} dBFS, attack ${lookaheadMs}ms, release ${Math.round(release * 1000)}ms` });

    // Step 3: Optional true peak protection (oversample)
    if (truePeak) {
      filters.push(`aresample=176400:resampler=soxr,alimiter=level_in=1:level_out=${ceilingLinear.toFixed(6)}:limit=${ceilingLinear.toFixed(6)},aresample=44100:resampler=soxr`);
      self.postMessage({ type: 'log', message: 'True peak protection: 4x oversample enabled' });
    }

    const codec = format === 'mp3' ? 'libmp3lame' : (format === 'wav' ? 'pcm_s16le' : 'aac');
    const fullFilter = filters.join(',');
    self.postMessage({ type: 'log', message: `Filter chain: ${fullFilter.substring(0, 80)}...` });
    await ffmpeg.exec(['-i', inputName, '-af', fullFilter, '-c:a', codec, '-y', outputName]);

    self.postMessage({ type: 'progress', value: 95 });
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data], { type: `audio/${format}` });
    await ffmpeg.deleteFile(inputName); await ffmpeg.deleteFile(outputName);
    self.postMessage({ type: 'complete', data: { blob, sizeMB: blob.size / 1024 / 1024 } });
  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message || 'Limiter failed', errorCode: 'FFMPEG_LOAD_FAILED' });
  }
};
