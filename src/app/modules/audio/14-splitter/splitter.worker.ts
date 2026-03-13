/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

self.onmessage = async (event: MessageEvent) => {
  const { file, format, mode, equalParts, silenceThresholdDb, silenceMinDurationSec } = event.data;
  try {
    self.postMessage({ type: 'progress', value: 2 });

    if (!ffmpeg) {
      ffmpeg = new FFmpeg();
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

    // Get duration via ffprobe output piped into log
    let duration = 0;
    ffmpeg.on('log', ({ message }) => {
      const match = message.match(/Duration: (\d+):(\d+):(\d+\.?\d*)/);
      if (match) {
        duration = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseFloat(match[3]);
      }
    });
    await ffmpeg.exec(['-i', inputName, '-f', 'null', '-']);

    self.postMessage({ type: 'log', message: `Detected duration: ${duration.toFixed(2)}s` });

    const blobs: Blob[] = [];
    
    if (mode === 'equal') {
      const segDuration = duration / equalParts;
      self.postMessage({ type: 'log', message: `Splitting into ${equalParts} equal parts of ${segDuration.toFixed(2)}s each` });
      
      for (let i = 0; i < equalParts; i++) {
        const startTime = i * segDuration;
        const segOutput = `seg_${i}.${format}`;
        await ffmpeg.exec([
          '-ss', startTime.toFixed(6),
          '-i', inputName,
          '-t', segDuration.toFixed(6),
          '-c:a', format === 'mp3' ? 'libmp3lame' : (format === 'wav' ? 'pcm_s16le' : 'aac'),
          '-y', segOutput
        ]);
        const data = await ffmpeg.readFile(segOutput);
        blobs.push(new Blob([data], { type: `audio/${format}` }));
        await ffmpeg.deleteFile(segOutput);
        self.postMessage({ type: 'progress', value: 10 + Math.round(((i + 1) / equalParts) * 80) });
      }
    } else {
      // Silence-based split using silencedetect filter
      // Extract silence timestamps from log output
      const silenceStarts: number[] = [];
      const silenceEnds: number[] = [];
      
      ffmpeg.on('log', ({ message }) => {
        const startMatch = message.match(/silence_start: ([\d.]+)/);
        const endMatch = message.match(/silence_end: ([\d.]+)/);
        if (startMatch) silenceStarts.push(parseFloat(startMatch[1]));
        if (endMatch) silenceEnds.push(parseFloat(endMatch[1]));
      });

      // Run silence detection pass
      await ffmpeg.exec([
        '-i', inputName,
        '-af', `silencedetect=noise=${silenceThresholdDb}dB:d=${silenceMinDurationSec}`,
        '-f', 'null', '-'
      ]);

      // Build split points at silence midpoints
      const splitPoints: number[] = [0];
      for (let i = 0; i < silenceStarts.length && i < silenceEnds.length; i++) {
        const mid = (silenceStarts[i] + silenceEnds[i]) / 2;
        splitPoints.push(mid);
      }
      splitPoints.push(duration);

      self.postMessage({ type: 'log', message: `Found ${silenceStarts.length} silence regions, creating ${splitPoints.length - 1} segments` });

      for (let i = 0; i < splitPoints.length - 1; i++) {
        const start = splitPoints[i];
        const dur = splitPoints[i + 1] - start;
        if (dur < 0.1) continue; // Skip very short segments
        const segOutput = `seg_${i}.${format}`;
        await ffmpeg.exec([
          '-ss', start.toFixed(6), '-i', inputName,
          '-t', dur.toFixed(6),
          '-c:a', format === 'mp3' ? 'libmp3lame' : (format === 'wav' ? 'pcm_s16le' : 'aac'),
          '-y', segOutput
        ]);
        const data = await ffmpeg.readFile(segOutput);
        blobs.push(new Blob([data], { type: `audio/${format}` }));
        await ffmpeg.deleteFile(segOutput);
        self.postMessage({ type: 'progress', value: 10 + Math.round(((i + 1) / (splitPoints.length - 1)) * 80) });
      }
    }

    await ffmpeg.deleteFile(inputName);
    self.postMessage({ type: 'progress', value: 98 });
    self.postMessage({ type: 'complete', data: { blobs, count: blobs.length } });

  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message || 'Worker FFmpeg failed', errorCode: 'FFMPEG_LOAD_FAILED' });
  }
};
