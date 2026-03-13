/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

self.onmessage = async (event: MessageEvent) => {
  const { file, format, delayMs, feedback, dryMix, wetMix } = event.data;
  
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

    // To simulate standard Delay/Echo, we use a single delay line and the user's feedback.
    // However, aecho decays are linear multipliers. For true repeating echo, ffmpeg's aecho 
    // requires explicitly chaining delays if we want infinite feedback, but we can do a long standard echo:
    // aecho=in_gain:out_gain:delays:decays
    // If feedback is high, we can stack 2-3 delays reducing by the feedback factor.
    
    const d1 = delayMs;
    const d2 = delayMs * 2;
    const d3 = delayMs * 3;
    
    const dec1 = feedback;
    const dec2 = feedback * feedback;
    const dec3 = feedback * feedback * feedback;

    // Use up to 3 echos for a tape-delay style effect
    const filter = \`aecho=\${dryMix}:\${wetMix}:\${d1}|\${d2}|\${d3}:\${dec1}|\${dec2}|\${dec3}\`;
    
    self.postMessage({ type: 'log', message: \`Applying Echo Filter: \${filter}\` });

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
