/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { EqBands } from './equalizer.schema';

let ffmpeg: FFmpeg | null = null;

self.onmessage = async (event: MessageEvent) => {
  const { file, format, bands } = event.data;
  const b = bands as EqBands;
  
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

    // Construct 10-band equalizer filter chain using the 'equalizer' filter
    // format: equalizer=f=FREQ:width_type=o:w=1:g=GAIN
    // 31.25, 62.5, 125, 250, 500, 1000, 2000, 4000, 8000, 16000 Hz
    const eqFilters = [
      `equalizer=f=31.25:width_type=o:w=1:g=\${b.hz31}`,
      `equalizer=f=62.5:width_type=o:w=1:g=\${b.hz62}`,
      `equalizer=f=125:width_type=o:w=1:g=\${b.hz125}`,
      `equalizer=f=250:width_type=o:w=1:g=\${b.hz250}`,
      `equalizer=f=500:width_type=o:w=1:g=\${b.hz500}`,
      `equalizer=f=1000:width_type=o:w=1:g=\${b.hz1k}`,
      `equalizer=f=2000:width_type=o:w=1:g=\${b.hz2k}`,
      `equalizer=f=4000:width_type=o:w=1:g=\${b.hz4k}`,
      `equalizer=f=8000:width_type=o:w=1:g=\${b.hz8k}`,
      `equalizer=f=16000:width_type=o:w=1:g=\${b.hz16k}`
    ];

    const filterString = eqFilters.join(',');
    
    self.postMessage({ type: 'log', message: `Applying equalizers: \${filterString}` });

    const args = [
      '-i', inputName,
      '-filter_complex', filterString,
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
