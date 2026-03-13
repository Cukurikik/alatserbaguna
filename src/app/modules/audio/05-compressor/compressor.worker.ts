/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

self.onmessage = async (event: MessageEvent) => {
  const { file, format, thresholdDb, ratio, attackMs, releaseMs, makeupGainDb } = event.data;
  
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

    // Convert makeup gain dB to linear multiplier for makeup setting
    // The filter expects it in dB, makeup=1 is default (0dB). 
    // Usually FFmpeg makeup is linear, but let's check docs: acompressor makeup is linear gain.
    // dB to Linear: 10^(dB/20)
    const makeupLinear = Math.pow(10, makeupGainDb / 20).toFixed(2);

    // acompressor params
    // threshold in dB (e.g. -20)
    // ratio is ratio (e.g. 4)
    // attack is ms (e.g. 20)
    // release is ms (e.g. 250)
    const filter = `acompressor=threshold=\${thresholdDb}dB:ratio=\${ratio}:attack=\${attackMs}:release=\${releaseMs}:makeup=\${makeupLinear}`;
    
    self.postMessage({ type: 'log', message: `Applying compression: \${filter}` });

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
    const blob = new Blob([outputData as any], { type: `audio/${format === 'm4a' ? 'mp4' : format}` });
    const sizeMB = blob.size / (1024 * 1024);

    // Cleanup
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    self.postMessage({ type: 'complete', data: { blob, sizeMB } });

  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message || 'Worker FFmpeg failed', errorCode: 'FFMPEG_LOAD_FAILED' });
  }
};
