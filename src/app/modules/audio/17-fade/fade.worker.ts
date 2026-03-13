/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

self.onmessage = async (event: MessageEvent) => {
  const { file, format, fadeInDuration, fadeOutDuration, curve } = event.data as {
    file: File; format: string; fadeInDuration: number; fadeOutDuration: number; curve: 'linear' | 'logarithmic' | 'sCurve';
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
    const outputName = 'output.' + format;
    const fileData = await file.arrayBuffer();
    await ffmpeg.writeFile(inputName, new Uint8Array(fileData));

    // Map curve type to FFmpeg afade curve
    const curveName: Record<string, string> = {
      linear: 'tri',
      logarithmic: 'log',
      sCurve: 'qsin'
    };
    const c = curveName[curve] ?? 'qsin';

    const filters: string[] = [];
    if (fadeInDuration > 0) {
      filters.push(`afade=t=in:ss=0:d=${fadeInDuration}:curve=${c}`);
    }
    if (fadeOutDuration > 0) {
      // Need to know duration for fade-out — we'll get it via log
      let duration = 0;
      ffmpeg.on('log', ({ message }) => {
        const m = message.match(/Duration: (\d+):(\d+):(\d+\.?\d*)/);
        if (m) duration = parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseFloat(m[3]);
      });
      // Quick pass to get duration
      await ffmpeg.exec(['-i', inputName, '-f', 'null', '-']);
      if (duration > 0) {
        const st = Math.max(0, duration - fadeOutDuration);
        filters.push(`afade=t=out:st=${st.toFixed(3)}:d=${fadeOutDuration}:curve=${c}`);
      }
    }

    if (filters.length === 0) {
      // No fade, just re-encode
      filters.push('acopy');
    }

    self.postMessage({ type: 'log', message: `Applying: ${filters.join(', ')}` });

    const args = [
      '-i', inputName,
      '-af', filters.join(','),
      '-c:a', format === 'mp3' ? 'libmp3lame' : (format === 'wav' ? 'pcm_s16le' : 'aac'),
      '-y', outputName
    ];
    await ffmpeg.exec(args);

    self.postMessage({ type: 'progress', value: 95 });
    const outputData = await ffmpeg.readFile(outputName);
    const blob = new Blob([outputData], { type: `audio/${format}` });
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
    self.postMessage({ type: 'complete', data: { blob, sizeMB: blob.size / 1024 / 1024 } });

  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message || 'Fade processing failed', errorCode: 'FFMPEG_LOAD_FAILED' });
  }
};
