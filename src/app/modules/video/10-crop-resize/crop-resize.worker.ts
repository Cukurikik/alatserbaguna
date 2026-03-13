/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { WorkerMessage } from '../shared/types/video.types';
import { CropResizeConfig } from './crop-resize.schema';

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

function ensureDivisibleBy2(n: number): number {
  const rounded = Math.round(n);
  return rounded % 2 === 0 ? rounded : rounded - 1;
}

addEventListener('message', async (event: MessageEvent<{ type: string; config: CropResizeConfig & { fileBuffer: ArrayBuffer, fileName: string } }>) => {
  if (event.data.type !== 'start') return;

  const { config } = event.data;
  const { fileBuffer, fileName, mode, cropRegion, targetWidth, targetHeight, lockAspectRatio, padMode } = config;

  try {
    const ff = await loadFFmpeg();
    await ff.writeFile(fileName, new Uint8Array(fileBuffer));

    ff.on('progress', ({ progress }) => {
      postMessage({ type: 'progress', value: Math.round(progress * 100) } as WorkerMessage);
    });

    const outputName = `omni_crop_resize_${fileName}`;
    const args = ['-i', fileName];

    let filter = '';
    if (mode === 'crop' && cropRegion) {
      const w = ensureDivisibleBy2(cropRegion.w);
      const h = ensureDivisibleBy2(cropRegion.h);
      const x = ensureDivisibleBy2(cropRegion.x);
      const y = ensureDivisibleBy2(cropRegion.y);
      filter = `crop=${w}:${h}:${x}:${y}`;
    } else if (mode === 'resize' && targetWidth && targetHeight) {
      const w = ensureDivisibleBy2(targetWidth);
      const h = ensureDivisibleBy2(targetHeight);
      
      if (lockAspectRatio) {
        if (padMode === 'pad') {
          filter = `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2`;
        } else if (padMode === 'crop-to-fit') {
          filter = `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}`;
        } else {
          filter = `scale=${w}:${h}`;
        }
      } else {
        filter = `scale=${w}:${h}`;
      }
    }

    if (filter) {
      args.push('-vf', filter);
      args.push('-preset', 'veryfast');
    } else {
      args.push('-c', 'copy');
    }

    args.push(outputName);

    await ff.exec(args);

    const data = await ff.readFile(outputName);
    await ff.deleteFile(fileName);
    await ff.deleteFile(outputName);

    postMessage({ type: 'complete', data: new Uint8Array(data as Uint8Array) } as WorkerMessage<Uint8Array>);
  } catch (error) {
    postMessage({ type: 'error', message: String(error), errorCode: 'FFMPEG_COMMAND_FAILED' } as WorkerMessage);
  }
});
