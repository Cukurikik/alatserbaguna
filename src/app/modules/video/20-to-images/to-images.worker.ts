/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { WorkerMessage } from '../shared/types/video.types';
import { ToImagesConfig } from './to-images.schema';
import * as fflate from 'fflate';

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

addEventListener('message', async (event: MessageEvent<{ type: string; config: ToImagesConfig & { fileBuffer: ArrayBuffer, fileName: string } }>) => {
  if (event.data.type !== 'start') return;

  const { config } = event.data;
  const { fileBuffer, fileName, fps, format, quality } = config;

  try {
    const ff = await loadFFmpeg();
    await ff.writeFile(fileName, new Uint8Array(fileBuffer));

    ff.on('progress', ({ progress }) => {
      // Scale progress to 0-80% for ffmpeg, 80-100% for zipping
      postMessage({ type: 'progress', value: Math.round(progress * 80) } as WorkerMessage);
    });

    const outputPattern = `frame_%04d.${format}`;
    const args = ['-i', fileName];

    // Set frame rate
    args.push('-vf', `fps=${fps}`);
    
    // Set quality
    if (format === 'jpg') {
      args.push('-q:v', quality.toString());
    }

    args.push(outputPattern);

    await ff.exec(args);

    // Read all generated files
    const files = await ff.listDir('.');
    const imageFiles = files.filter(f => f.name.startsWith('frame_') && f.name.endsWith(`.${format}`));
    
    if (imageFiles.length === 0) {
      throw new Error('No images generated');
    }

    const zipData: Record<string, Uint8Array> = {};
    
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const data = await ff.readFile(file.name);
      zipData[file.name] = data as Uint8Array;
      await ff.deleteFile(file.name);
      
      // Update progress 80-100%
      if (i % 10 === 0) {
        postMessage({ type: 'progress', value: 80 + Math.round((i / imageFiles.length) * 15) } as WorkerMessage);
      }
    }

    await ff.deleteFile(fileName);

    // Zip the files
    const zipped = fflate.zipSync(zipData, { level: 0 }); // level 0 because images are already compressed
    
    postMessage({ type: 'progress', value: 100 } as WorkerMessage);
    postMessage({ type: 'complete', data: zipped } as WorkerMessage<Uint8Array>);
  } catch (error) {
    postMessage({ type: 'error', message: String(error), errorCode: 'FFMPEG_COMMAND_FAILED' } as WorkerMessage);
  }
});
