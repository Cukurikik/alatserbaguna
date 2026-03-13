/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

self.onmessage = async (event: MessageEvent) => {
  const { file, format, semitones, preserveTempo } = event.data;
  
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

    // Calculate pitch multiplier from semitones
    // f2 = f1 * (2 ^ (semitones / 12))
    const ratio = Math.pow(2, semitones / 12);
    
    // Fallback approach if rubberband is not available in standard FFmpeg WASM:
    // Change sample rate to shift pitch & speed -> resample back -> fix tempo.
    // asetrate=44100*ratio,aresample=44100
    // If preserveTempo is true, apply atempo=1/ratio
    // Note: atempo only allows [0.5, 100]. If ratio is > 2, 1/ratio is < 0.5.
    // If we shift -12 semitones, ratio = 0.5 -> 1/ratio = 2.0 (Valid)
    // If we shift +12 semitones, ratio = 2.0 -> 1/ratio = 0.5 (Valid)
    // So the +/- 12 semitones range is safely within one atempo filter pass.

    let filter = \`asetrate=44100*\${ratio},aresample=44100\`;
    if (preserveTempo && semitones !== 0) {
       filter += \`,atempo=\${1/ratio}\`;
    }
    
    self.postMessage({ type: 'log', message: \`Applying Pitch Filter: \${filter}\` });

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
