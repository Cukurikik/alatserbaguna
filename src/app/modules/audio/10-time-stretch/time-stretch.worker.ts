/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

const buildAtempoChain = (speed: number): string => {
  if (speed >= 0.5 && speed <= 2.0) {
    return \`atempo=\${speed}\`;
  }
  
  const chain: string[] = [];
  let remaining = speed;
  
  while (remaining > 2.0) {
    chain.push('atempo=2.0');
    remaining /= 2.0;
  }
  while (remaining < 0.5) {
    chain.push('atempo=0.5');
    remaining /= 0.5;
  }
  
  if (remaining !== 1.0) {
    chain.push(\`atempo=\${remaining}\`);
  }
  
  return chain.join(',');
};

self.onmessage = async (event: MessageEvent) => {
  const { file, format, speed, pitchLock } = event.data;
  
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

    let filter = '';
    
    if (pitchLock) {
      // WSOLA algorithmic stretch, pitch remains constant
      // FFmpeg provides atempo filter which ranges from 0.5 to 2.0.
      filter = buildAtempoChain(speed);
    } else {
      // Vinyl mode: asetrate scales frequency effectively changing pitch and duration
      // speed = 1.5 -> plays 1.5x faster -> pitch goes up -> asetrate=44100*1.5
      filter = \`asetrate=44100*\${speed},aresample=44100\`;
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
