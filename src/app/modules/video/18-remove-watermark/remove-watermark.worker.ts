/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { WorkerMessage } from '../shared/types/video.types';
import { RemoveWatermarkConfig } from './remove-watermark.schema';

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

addEventListener('message', async (event: MessageEvent<{ type: string; config: RemoveWatermarkConfig & { fileBuffer: ArrayBuffer, fileName: string } }>) => {
  if (event.data.type !== 'start') return;

  const { config } = event.data;
  const { fileBuffer, fileName, x, y, width, height, blurStrength } = config;

  try {
    const ff = await loadFFmpeg();
    await ff.writeFile(fileName, new Uint8Array(fileBuffer));

    ff.on('progress', ({ progress }) => {
      postMessage({ type: 'progress', value: Math.round(progress * 100) } as WorkerMessage);
    });

    const outputName = `omni_nowatermark_${fileName}`;
    const args = ['-i', fileName];

    // Use delogo filter to remove watermark (or boxblur)
    // delogo is usually better for watermarks: delogo=x=0:y=0:w=100:h=100
    // If delogo fails, we can fallback to boxblur. Let's use boxblur for more control over blur strength.
    // boxblur=luma_radius=min(h\,w)/10:luma_power=1:chroma_radius=min(cw\,ch)/10:chroma_power=1
    // Actually, delogo is standard for this. Let's use delogo.
    // Wait, delogo doesn't have blur strength. Let's use a cropped boxblur and overlay it.
    
    // [0:v]crop=w:h:x:y,boxblur=blurStrength[wm];[0:v][wm]overlay=x:y
    const filterComplex = `[0:v]crop=${width}:${height}:${x}:${y},boxblur=${blurStrength}:1[wm];[0:v][wm]overlay=${x}:${y}`;

    args.push('-filter_complex', filterComplex);
    args.push('-c:a', 'copy'); // Copy audio

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
