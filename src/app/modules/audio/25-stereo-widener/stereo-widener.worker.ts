/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

self.onmessage = async (event: MessageEvent) => {
  const { file, format, width, mode } = event.data as { file: File; format: string; width: number; mode: string };
  try {
    self.postMessage({ type: 'progress', value: 2 });
    if (!ffmpeg) {
      ffmpeg = new FFmpeg();
      ffmpeg.on('progress', ({ progress }) => { self.postMessage({ type: 'progress', value: 10 + Math.round(progress * 82) }); });
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({ coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'), wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm') });
    }
    self.postMessage({ type: 'progress', value: 10 });

    const inputName = 'sw_in.' + file.name.split('.').pop();
    const outputName = 'sw_out.' + format;
    await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));

    const codec = format === 'mp3' ? 'libmp3lame' : (format === 'wav' ? 'pcm_s16le' : 'aac');

    // extrastereo: scales the difference between L and R channels by factor `m`
    // width=0 → m=0 (mono), width=1 → m=1 (original stereo), width=2 → m=2 (double wide)
    const m = width; // maps directly: extrastereo multiplier

    // stereotools: more advanced, uses mid-side manipulation
    // For stereotools: mlev (mid level 0-4), slev (side level 0-4)
    // Wide = boost side, narrow = boost mid
    const midLevel = Math.max(0.1, 2 - width);  // inversely scale mid
    const sideLevel = width;

    let audioFilter: string;
    if (mode === 'extrastereo') {
      audioFilter = `extrastereo=m=${m.toFixed(3)}`;
      self.postMessage({ type: 'log', message: `extrastereo: m=${m.toFixed(3)} (0=mono, 1=original, 2=max)` });
    } else {
      audioFilter = `stereotools=mlev=${midLevel.toFixed(3)}:slev=${sideLevel.toFixed(3)}`;
      self.postMessage({ type: 'log', message: `stereotools: mid=${midLevel.toFixed(2)}, side=${sideLevel.toFixed(2)}` });
    }

    await ffmpeg.exec(['-i', inputName, '-af', audioFilter, '-c:a', codec, '-y', outputName]);

    self.postMessage({ type: 'progress', value: 95 });
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data as any], { type: `audio/${format}` });
    await ffmpeg.deleteFile(inputName); await ffmpeg.deleteFile(outputName);
    self.postMessage({ type: 'complete', data: { blob, sizeMB: blob.size / 1024 / 1024 } });
  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message || 'Stereo widening failed', errorCode: 'FFMPEG_LOAD_FAILED' });
  }
};
