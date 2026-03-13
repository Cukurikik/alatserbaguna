/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

self.onmessage = async (event: MessageEvent) => {
  const { file, format, crossfadeEdges } = event.data;
  
  try {
    self.postMessage({ type: 'progress', value: 2 });
    
    if (!ffmpeg) {
      ffmpeg = new FFmpeg();
      ffmpeg.on('progress', ({ progress }) => {
        self.postMessage({ type: 'progress', value: 10 + Math.round(progress * 85) });
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
    
    self.postMessage({ type: 'log', message: \`Writing \${file.name} to memory...\` });
    const fileData = await file.arrayBuffer();
    await ffmpeg.writeFile(inputName, new Uint8Array(fileData));

    // FFmpeg's `areverse` filter reverses the audio entirely.
    // Memory intensive on very large tracks, but works great for most audio.
    let filter = 'areverse';
    
    // Optional fade in / fade out at edges after reversing to avoid popping
    if (crossfadeEdges) {
      // Need audio duration to fade out properly, using simplified 0.1s fast fading on both ends
      // Because `areverse` doesn't change duration, afade is straightforward.
      // D is not strictly needed for fade in, but afade out needs timestamp.
      // If we don't know duration exactly in filter, we can't easily tail-fade without two passes.
      // Easiest is to just ignore tail fade or only fade-in the reverse for the first 50ms.
      filter += ',afade=t=in:ss=0:d=0.05';
    }

    self.postMessage({ type: 'log', message: \`Applying Filter: \${filter}\` });

    const args = [
      '-i', inputName,
      '-filter_complex', filter,
      '-c:a', format === 'mp3' ? 'libmp3lame' : (format === 'wav' ? 'pcm_s16le' : 'aac'),
      '-y',
      outputName
    ];

    await ffmpeg.exec(args);

    self.postMessage({ type: 'progress', value: 95 });

    const outputData = await ffmpeg.readFile(outputName);
    const blob = new Blob([outputData], { type: \`audio/\${format === 'm4a' ? 'mp4' : format}\` });
    const sizeMB = blob.size / (1024 * 1024);

    // Cleanup
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    self.postMessage({ type: 'complete', data: { blob, sizeMB } });

  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message || 'Worker FFmpeg failed', errorCode: 'FFMPEG_LOAD_FAILED' });
  }
};
