/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

self.onmessage = async (event: MessageEvent) => {
  const { file, format, repeatCount, crossfadeDurationSec } = event.data as {
    file: File; format: string; repeatCount: number; crossfadeDurationSec: number;
  };

  try {
    self.postMessage({ type: 'progress', value: 2 });
    if (!ffmpeg) {
      ffmpeg = new FFmpeg();
      ffmpeg.on('progress', ({ progress }) => {
        self.postMessage({ type: 'progress', value: 10 + Math.round(progress * 80) });
      });
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
    }
    self.postMessage({ type: 'progress', value: 10 });

    const inputName = 'input_' + file.name.replace(/[^a-zA-Z0-9.]/g, '');
    const fileData = await file.arrayBuffer();
    await ffmpeg.writeFile(inputName, new Uint8Array(fileData));

    // Get source duration
    let duration = 0;
    ffmpeg.on('log', ({ message }) => {
      const m = message.match(/Duration: (\d+):(\d+):(\d+\.?\d*)/);
      if (m) duration = parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseFloat(m[3]);
    });
    await ffmpeg.exec(['-i', inputName, '-f', 'null', '-']);

    self.postMessage({ type: 'log', message: `Source: ${duration.toFixed(2)}s, Repeating ${repeatCount}x, Crossfade ${crossfadeDurationSec}s` });

    // Strategy: Build a concat list with N copies, then use acrossfade between each pair
    // We'll write the file N times with separate names and concat with acrossfade
    // For simplicity at scale, use FFmpeg built-in `aloop` filter for count-based repetition
    // then apply a single crossfade at the join using blend of start+end

    // Use aloop + afade strategy:
    // aloop=loop=N:size=total_samples produces N loops
    // Then apply crossfade between tail and head with acrossfade
    
    // Simpler approach: concat N copies, each crossfaded to the next
    // Write all copies to list.txt
    const listLines: string[] = [];
    for (let i = 0; i < repeatCount; i++) {
      listLines.push(`file '${inputName}'`);
    }
    const listContent = listLines.join('\n');
    await ffmpeg.writeFile('loop_list.txt', listContent);

    const outputName = 'output.' + format;
    const codec = format === 'mp3' ? 'libmp3lame' : (format === 'wav' ? 'pcm_s16le' : 'aac');

    if (crossfadeDurationSec <= 0) {
      // Simple concat
      await ffmpeg.exec([
        '-f', 'concat', '-safe', '0', '-i', 'loop_list.txt',
        '-c:a', codec, '-y', outputName
      ]);
    } else {
      // Apply crossfade using acrossfade filter for each join
      // Build filter graph: [0][1]acrossfade=d=X[cf01], [cf01][2]acrossfade=d=X[cf012], ...
      const labels: string[] = [];
      const filterParts: string[] = [];

      for (let i = 0; i < repeatCount - 1; i++) {
        const inA = i === 0 ? `[${i}:a]` : `[cf${i - 1}]`;
        const inB = `[${i + 1}:a]`;
        const outLabel = `[cf${i}]`;
        filterParts.push(`${inA}${inB}acrossfade=d=${crossfadeDurationSec}`);
        if (i < repeatCount - 2) filterParts.push(outLabel);
        labels.push(outLabel);
      }
      const filterComplex = filterParts.join('');

      // Build input args
      const inputArgs: string[] = [];
      for (let i = 0; i < repeatCount; i++) {
        inputArgs.push('-i', inputName);
      }

      await ffmpeg.exec([
        ...inputArgs,
        '-filter_complex', filterComplex,
        '-c:a', codec, '-y', outputName
      ]);
    }

    self.postMessage({ type: 'progress', value: 95 });
    const outputData = await ffmpeg.readFile(outputName);
    const blob = new Blob([outputData], { type: `audio/${format}` });
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile('loop_list.txt');
    await ffmpeg.deleteFile(outputName);
    self.postMessage({ type: 'complete', data: { blob, sizeMB: blob.size / 1024 / 1024 } });

  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message || 'Looper failed', errorCode: 'FFMPEG_LOAD_FAILED' });
  }
};
