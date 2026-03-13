/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

self.onmessage = async (event: MessageEvent) => {
  const { file, format, bitrate, sampleRate, channels } = event.data;
  
  try {
    self.postMessage({ type: 'progress', value: 2 });
    
    if (!ffmpeg) {
      ffmpeg = new FFmpeg();
      ffmpeg.on('progress', ({ progress }) => {
        self.postMessage({ type: 'progress', value: 10 + Math.round(progress * 85) });
      });

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`\${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`\${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
    }

    self.postMessage({ type: 'progress', value: 10 });

    const inputName = 'input_' + file.name.replace(/[^a-zA-Z0-9.]/g, '');
    const outputName = 'output.' + format;
    
    self.postMessage({ type: 'log', message: `Writing \${file.name} to memory...` });
    const fileData = await file.arrayBuffer();
    await ffmpeg.writeFile(inputName, new Uint8Array(fileData));

    // Determine codec
    let codec = 'copy';
    if (format === 'mp3') codec = 'libmp3lame';
    else if (format === 'wav') codec = 'pcm_s16le';
    else if (format === 'aac' || format === 'm4a') codec = 'aac';
    else if (format === 'flac') codec = 'flac';
    else if (format === 'ogg') codec = 'libvorbis';
    else if (format === 'opus') codec = 'libopus';

    self.postMessage({ type: 'log', message: `Converting to \${format.toUpperCase()} (Codec: \${codec}, \${bitrate}, \${sampleRate}Hz, \${channels}ch)` });

    const args = [
      '-i', inputName,
      '-c:a', codec,
      '-b:a', bitrate,
      '-ar', sampleRate.toString(),
      '-ac', channels.toString(),
      '-y',
      outputName
    ];

    await ffmpeg.exec(args);

    self.postMessage({ type: 'progress', value: 95 });

    const outputData = await ffmpeg.readFile(outputName);
    const blob = new Blob([outputData], { type: `audio/\${format === 'm4a' ? 'mp4' : format}` });
    const sizeMB = blob.size / (1024 * 1024);

    // Cleanup
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    self.postMessage({ type: 'complete', data: { blob, sizeMB } });

  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message || 'Worker FFmpeg failed', errorCode: 'FFMPEG_LOAD_FAILED' });
  }
};
