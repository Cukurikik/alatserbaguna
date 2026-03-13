/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

self.onmessage = async (event: MessageEvent) => {
  const { file, operation, format } = event.data as { file: File; operation: string; format: string; };

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

    const inputName = 'batch_in_' + file.name.replace(/[^a-zA-Z0-9.]/g, '');
    const outputName = 'batch_out.' + format;
    const fileData = await file.arrayBuffer();
    await ffmpeg.writeFile(inputName, new Uint8Array(fileData));

    const codec = format === 'mp3' ? 'libmp3lame' : (format === 'wav' ? 'pcm_s16le' : 'aac');

    let args: string[] = ['-i', inputName];

    switch (operation) {
      case 'convert':
        args = [...args, '-c:a', codec];
        break;
      case 'normalize':
        args = [...args, '-af', 'loudnorm=I=-14:LRA=11:TP=-1', '-c:a', codec];
        break;
      case 'compress':
        args = [...args, '-af', 'acompressor=threshold=0.089:ratio=4:attack=200:release=1000', '-c:a', codec];
        break;
      case 'trim-silence':
        args = [...args, '-af', 'silenceremove=start_periods=1:start_silence=0.1:start_threshold=-50dB:stop_periods=-1:stop_silence=0.1:stop_threshold=-50dB', '-c:a', codec];
        break;
      default:
        args = [...args, '-c:a', codec];
    }

    args = [...args, '-y', outputName];
    self.postMessage({ type: 'log', message: `Operation: ${operation} → ${format}` });
    await ffmpeg.exec(args);

    self.postMessage({ type: 'progress', value: 95 });
    const outputData = await ffmpeg.readFile(outputName);
    const blob = new Blob([outputData as any], { type: `audio/${format}` });
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
    self.postMessage({ type: 'complete', data: { blob, sizeMB: blob.size / 1024 / 1024 } });

  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message || 'Batch worker failed', errorCode: 'FFMPEG_LOAD_FAILED' });
  }
};
