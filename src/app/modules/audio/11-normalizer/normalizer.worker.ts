/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

self.onmessage = async (event: MessageEvent) => {
  const { file, format, mode, targetLevel, truePeak } = event.data;
  
  try {
    self.postMessage({ type: 'progress', value: 2 });
    
    if (!ffmpeg) {
      ffmpeg = new FFmpeg();
      ffmpeg.on('progress', ({ progress }) => {
        // Normalizing especially loudnorm requires a 2-pass analysis in actual C++ ffmpeg,
        // but the simplest 'loudnorm' filter runs in 1-pass dynamically if not given measured stats.
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
    
    if (mode === 'peak') {
      // Very basic peak normalization filter in FFmpeg is 'volume' filter using a dynamic evaluation if stats were known.
      // Easiest true peak normalizer in FFmpeg is 'alimiter' or using pan/volume, but 'loudnorm' can act as a limiter.
      // Another peak scaling: 'dynaudnorm' - dynamic audio normalizer.
      // Using dynaudnorm gives a fast, broadcast quality simple peak normalizer:
      filter = \`dynaudnorm=p=\${Math.pow(10, targetLevel/20)}\`; 
      self.postMessage({ type: 'log', message: \`Using dynamic peak normalizer aiming for \${targetLevel}dB\` });
    } else {
      // EBU R128 LUFS Normalizer (loudnorm)
      // I=Target LUFS, TP=True Peak limit, LRA=Loudness Range (default 7.0 is good)
      filter = \`loudnorm=I=\${targetLevel}:TP=\${truePeak}:LRA=7.0\`;
      self.postMessage({ type: 'log', message: \`Using EBU R128 LUFS Loudnorm (I=\${targetLevel}, TP=\${truePeak})\` });
    }

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
