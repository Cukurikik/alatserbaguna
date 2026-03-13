/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

self.onmessage = async (event: MessageEvent) => {
  const { file, format, thresholdDb, minSilenceDuration, paddingDuration } = event.data as {
    file: File; format: string; thresholdDb: number; minSilenceDuration: number; paddingDuration: number;
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

    const inputName = 'sil_in.' + file.name.split('.').pop();
    const outputName = 'sil_out.' + format;
    await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));

    // FFmpeg silence detection + removal filter
    // silenceremove: removes leading/trailing/internal silence
    const threshold = `${thresholdDb}dB`;
    const silenceFilter = `silenceremove=start_periods=1:start_duration=${minSilenceDuration}:start_threshold=${threshold}:stop_periods=-1:stop_duration=${minSilenceDuration}:stop_threshold=${threshold}`;
    const codec = format === 'mp3' ? 'libmp3lame' : (format === 'wav' ? 'pcm_s16le' : 'aac');

    self.postMessage({ type: 'log', message: `Removing silence below ${thresholdDb}dB (min ${minSilenceDuration}s)` });
    await ffmpeg.exec(['-i', inputName, '-af', silenceFilter, '-c:a', codec, '-y', outputName]);

    self.postMessage({ type: 'progress', value: 95 });
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data as any], { type: `audio/${format}` });
    await ffmpeg.deleteFile(inputName); await ffmpeg.deleteFile(outputName);
    const originalMB = file.size / 1024 / 1024;
    const outputMB = blob.size / 1024 / 1024;
    const info = `Original: ${originalMB.toFixed(2)} MB → Output: ${outputMB.toFixed(2)} MB (saved ${((1 - outputMB / originalMB) * 100).toFixed(1)}%)`;
    self.postMessage({ type: 'complete', data: { blob, sizeMB: outputMB, info } });
  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message || 'Silence removal failed', errorCode: 'FFMPEG_LOAD_FAILED' });
  }
};
