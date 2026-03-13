/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

self.onmessage = async (event: MessageEvent) => {
  const { file, format, roomSizeMs, damping, dryMix, wetMix } = event.data;
  
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

    // To simulate reverb with aecho, we use multiple short delays reflecting off "walls".
    // aecho=in_gain:out_gain:delays:decays
    // e.g. aecho=0.8:0.4:40|50|70:0.4|0.3|0.2
    
    // Create dual reflection path for stereo-like room widening
    const d1 = roomSizeMs;
    const d2 = Math.round(roomSizeMs * 1.3);
    const d3 = Math.round(roomSizeMs * 1.7);
    
    const dec1 = damping;
    const dec2 = damping * 0.8;
    const dec3 = damping * 0.6;

    const filter = `aecho=\${dryMix}:\${wetMix}:\${d1}|\${d2}|\${d3}:\${dec1}|\${dec2}|\${dec3}`;
    
    self.postMessage({ type: 'log', message: `Applying Reverb Filter: \${filter}` });

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
    const blob = new Blob([outputData as any], { type: `audio/\${format === 'm4a' ? 'mp4' : format}` });
    const sizeMB = blob.size / (1024 * 1024);

    // Cleanup
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    self.postMessage({ type: 'complete', data: { blob, sizeMB } });

  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message || 'Worker FFmpeg failed', errorCode: 'FFMPEG_LOAD_FAILED' });
  }
};
