/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

self.onmessage = async (event: MessageEvent) => {
  const { file, format, strength, noiseFloor } = event.data;
  try {
    self.postMessage({ type: 'progress', value: 2 });
    if (!ffmpeg) {
      ffmpeg = new FFmpeg();
      ffmpeg.on('progress', ({ progress }) => {
        self.postMessage({ type: 'progress', value: 10 + Math.round(progress * 85) });
      });
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
    }
    self.postMessage({ type: 'progress', value: 10 });

    const inputName = 'input_' + file.name.replace(/[^a-zA-Z0-9.]/g, '');
    const outputName = 'output.' + format;
    const fileData = await file.arrayBuffer();
    await ffmpeg.writeFile(inputName, new Uint8Array(fileData));

    // afftdn = Adaptive Frequency Filter Denoiser
    // nr = noise reduction strength (0-97 dB)
    // nf = expected noise floor in dBFS (e.g., -25)
    const filter = `afftdn=nr=${strength}:nf=${noiseFloor}`;
    self.postMessage({ type: 'log', message: `Applying afftdn denoiser: nr=${strength}, nf=${noiseFloor}` });

    await ffmpeg.exec([
      '-i', inputName,
      '-af', filter,
      '-c:a', format === 'mp3' ? 'libmp3lame' : (format === 'wav' ? 'pcm_s16le' : 'aac'),
      '-y', outputName
    ]);

    self.postMessage({ type: 'progress', value: 95 });
    const outputData = await ffmpeg.readFile(outputName);
    const blob = new Blob([outputData], { type: `audio/${format === 'm4a' ? 'mp4' : format}` });
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
    self.postMessage({ type: 'complete', data: { blob, sizeMB: blob.size / 1024 / 1024 } });
  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message || 'Worker FFmpeg failed', errorCode: 'FFMPEG_LOAD_FAILED' });
  }
};
