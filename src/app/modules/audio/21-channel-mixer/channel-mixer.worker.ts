/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

self.onmessage = async (event: MessageEvent) => {
  const { file, format, operation, monoMode } = event.data as { file: File; format: string; operation: string; monoMode: string };
  try {
    self.postMessage({ type: 'progress', value: 2 });
    if (!ffmpeg) {
      ffmpeg = new FFmpeg();
      ffmpeg.on('progress', ({ progress }) => { self.postMessage({ type: 'progress', value: 10 + Math.round(progress * 82) }); });
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({ coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'), wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm') });
    }
    self.postMessage({ type: 'progress', value: 10 });

    const inputName = 'ch_in.' + file.name.split('.').pop();
    const outputName = 'ch_out.' + format;
    await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));

    const codec = format === 'mp3' ? 'libmp3lame' : (format === 'wav' ? 'pcm_s16le' : 'aac');

    // Build FFmpeg args based on operation
    let audioFilter = '';
    switch (operation) {
      case 'toMono':
        audioFilter = monoMode === 'left' ? 'pan=mono|c0=FL'
          : monoMode === 'right' ? 'pan=mono|c0=FR'
          : 'pan=mono|c0=0.5*FL+0.5*FR';
        break;
      case 'toStereo':
        audioFilter = 'pan=stereo|FL=FC|FR=FC';
        break;
      case 'swapLR':
        audioFilter = 'pan=stereo|FL=FR|FR=FL';
        break;
      case 'extractL':
        audioFilter = 'pan=mono|c0=FL';
        break;
      case 'extractR':
        audioFilter = 'pan=mono|c0=FR';
        break;
      case 'midSideEncode':
        audioFilter = 'pan=stereo|FL=0.5*FL+0.5*FR|FR=0.5*FL-0.5*FR';
        break;
      default:
        audioFilter = 'acopy';
    }

    self.postMessage({ type: 'log', message: `Operation: ${operation} → filter: ${audioFilter}` });
    await ffmpeg.exec(['-i', inputName, '-af', audioFilter, '-c:a', codec, '-y', outputName]);

    self.postMessage({ type: 'progress', value: 95 });
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data as any], { type: `audio/${format}` });
    await ffmpeg.deleteFile(inputName); await ffmpeg.deleteFile(outputName);
    self.postMessage({ type: 'complete', data: { blob, sizeMB: blob.size / 1024 / 1024 } });
  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message || 'Channel mix failed', errorCode: 'FFMPEG_LOAD_FAILED' });
  }
};
