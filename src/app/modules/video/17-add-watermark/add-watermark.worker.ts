/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { WorkerMessage } from '../shared/types/video.types';
import { AddWatermarkConfig } from './add-watermark.schema';

let ffmpeg: FFmpeg | null = null;

async function loadFFmpeg() {
  if (ffmpeg) return ffmpeg;
  ffmpeg = new FFmpeg();
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  return ffmpeg;
}

addEventListener('message', async (event: MessageEvent<{ type: string; config: AddWatermarkConfig & { fileBuffer: ArrayBuffer, fileName: string, watermarkBuffer: ArrayBuffer, watermarkFileName: string } }>) => {
  if (event.data.type !== 'start') return;

  const { config } = event.data;
  const { fileBuffer, fileName, watermarkBuffer, watermarkFileName, position, opacity, scale, padding } = config;

  try {
    const ff = await loadFFmpeg();
    await ff.writeFile(fileName, new Uint8Array(fileBuffer));
    await ff.writeFile(watermarkFileName, new Uint8Array(watermarkBuffer));

    ff.on('progress', ({ progress }) => {
      postMessage({ type: 'progress', value: Math.round(progress * 100) } as WorkerMessage);
    });

    const outputName = `omni_watermarked_${fileName}`;
    const args = ['-i', fileName, '-i', watermarkFileName];

    // Build filter complex
    // 1. Scale watermark
    // 2. Adjust opacity (format=rgba,colorchannelmixer=aa=opacity)
    // 3. Overlay
    
    const opacityValue = opacity / 100;
    const scaleValue = scale / 100;
    
    let overlayPos = '';
    switch (position) {
      case 'top-left':
        overlayPos = `${padding}:${padding}`;
        break;
      case 'top-right':
        overlayPos = `W-w-${padding}:${padding}`;
        break;
      case 'bottom-left':
        overlayPos = `${padding}:H-h-${padding}`;
        break;
      case 'bottom-right':
        overlayPos = `W-w-${padding}:H-h-${padding}`;
        break;
      case 'center':
        overlayPos = `(W-w)/2:(H-h)/2`;
        break;
    }

    // [0:v] is video, [1:v] is watermark
    // scale2ref scales watermark relative to video width
    const filterComplex = `[1:v][0:v]scale2ref=w=iw*${scaleValue}:h=ow/a[wm][vid];[wm]format=rgba,colorchannelmixer=aa=${opacityValue}[wm2];[vid][wm2]overlay=${overlayPos}`;

    args.push('-filter_complex', filterComplex);
    args.push('-c:a', 'copy'); // Copy audio
    args.push(outputName);

    await ff.exec(args);

    const data = await ff.readFile(outputName);
    await ff.deleteFile(fileName);
    await ff.deleteFile(watermarkFileName);
    await ff.deleteFile(outputName);

    postMessage({ type: 'complete', data: new Uint8Array(data as Uint8Array) } as WorkerMessage<Uint8Array>);
  } catch (error) {
    postMessage({ type: 'error', message: String(error), errorCode: 'FFMPEG_COMMAND_FAILED' } as WorkerMessage);
  }
});
