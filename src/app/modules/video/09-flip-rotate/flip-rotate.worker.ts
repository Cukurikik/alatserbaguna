/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { WorkerMessage } from '../shared/types/video.types';
import { FlipRotateConfig } from './flip-rotate.schema';

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

function buildFilterChain(flipH: boolean, flipV: boolean, rotation: number): string {
  const filters: string[] = [];
  
  if (flipH) filters.push('hflip');
  if (flipV) filters.push('vflip');
  
  if (rotation === 90) {
    filters.push('transpose=1');
  } else if (rotation === 180) {
    filters.push('vflip,hflip');
  } else if (rotation === 270) {
    filters.push('transpose=2');
  } else if (rotation !== 0) {
    filters.push(`rotate=${rotation}*PI/180`);
  }
  
  return filters.join(',');
}

addEventListener('message', async (event: MessageEvent<{ type: string; config: FlipRotateConfig & { fileBuffer: ArrayBuffer, fileName: string } }>) => {
  if (event.data.type !== 'start') return;

  const { config } = event.data;
  const { fileBuffer, fileName, flipH, flipV, rotation } = config;

  try {
    const ff = await loadFFmpeg();
    await ff.writeFile(fileName, new Uint8Array(fileBuffer));

    ff.on('progress', ({ progress }) => {
      postMessage({ type: 'progress', value: Math.round(progress * 100) } as WorkerMessage);
    });

    const outputName = `omni_flip_rotate_${fileName}`;
    const filterChain = buildFilterChain(flipH, flipV, rotation);

    const args = ['-i', fileName];
    
    if (filterChain) {
      args.push('-vf', filterChain);
      args.push('-preset', 'ultrafast', '-crf', '18');
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
