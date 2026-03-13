/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

self.onmessage = async (event: MessageEvent) => {
  const { file, startTimeMs, endTimeMs, format } = event.data;
  
  try {
    self.postMessage({ type: 'progress', value: 5 });
    
    if (!ffmpeg) {
      ffmpeg = new FFmpeg();
      ffmpeg.on('progress', ({ progress }) => {
        self.postMessage({ type: 'progress', value: 10 + Math.round(progress * 80) });
      });

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(\`\${baseURL}/ffmpeg-core.js\`, 'text/javascript'),
        wasmURL: await toBlobURL(\`\${baseURL}/ffmpeg-core.wasm\`, 'application/wasm'),
      });
    }

    self.postMessage({ type: 'progress', value: 10 });

    const inputName = 'input_' + file.name.replace(/[^a-zA-Z0-9.]/g, '');
    const outputName = 'output.' + format;
    
    const fileData = await file.arrayBuffer();
    await ffmpeg.writeFile(inputName, new Uint8Array(fileData));

    const startTimeSec = (startTimeMs / 1000).toFixed(3);
    const durationSec = ((endTimeMs - startTimeMs) / 1000).toFixed(3);

    self.postMessage({ type: 'log', message: \`Trimming \${inputName} from \${startTimeSec}s, length: \${durationSec}s\` });

    // Precise cut: flag -ss before input is faster, but sometimes less accurate for audio.
    // For exact precision, we use -ss and -t after input, or before for speed.
    // Given we want frame-accurate precision, doing it after input is safer for pure audio formats without keyframes.
    await ffmpeg.exec([
      '-i', inputName,
      '-ss', startTimeSec,
      '-t', durationSec,
      '-c:a', format === 'mp3' ? 'libmp3lame' : (format === 'wav' ? 'pcm_s16le' : (format === 'aac' || format === 'm4a' ? 'aac' : 'copy')),
      '-b:a', '192k', // reasonable bitrate
      '-y',
      outputName
    ]);

    self.postMessage({ type: 'progress', value: 95 });

    const outputData = await ffmpeg.readFile(outputName);
    const blob = new Blob([outputData], { type: \`audio/\${format === 'm4a' ? 'mp4' : format}\` });
    const sizeMB = blob.size / (1024 * 1024);

    // Cleanup
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    self.postMessage({ 
      type: 'complete', 
      data: { blob, sizeMB } 
    });

  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message || 'Worker FFmpeg failed', errorCode: 'FFMPEG_LOAD_FAILED' });
  }
};
