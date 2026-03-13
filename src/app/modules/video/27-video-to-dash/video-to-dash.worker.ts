/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { WorkerMessage } from '../shared/types/video.types';
import { VideoToDashConfig } from './video-to-dash.schema';
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

addEventListener('message', async (event: MessageEvent<{ type: string; config: VideoToDashConfig & { fileBuffer: ArrayBuffer, fileName: string } }>) => {
  if (event.data.type !== 'start') return;

  const { config } = event.data;
  const { fileBuffer, fileName, segmentDuration, preset } = config;

  try {
    const ff = await loadFFmpeg();
    await ff.writeFile(fileName, new Uint8Array(fileBuffer));

    ff.on('progress', ({ progress }) => {
      postMessage({ type: 'progress', value: Math.round(progress * 100) } as WorkerMessage);
    });

    const outputManifest = 'manifest.mpd';
    
    const args = [
      '-i', fileName,
      '-map', '0',
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-b:v:0', '800k',
      '-s:v:0', '854x480',
      '-profile:v:0', 'main',
      '-use_timeline', '1',
      '-use_template', '1',
      '-window_size', '0',
      '-adaptation_sets', 'id=0,streams=v id=1,streams=a',
      '-f', 'dash',
      '-preset', preset,
      outputManifest
    ];

    await ff.exec(args);

    // Read all generated files (manifest.mpd and chunk-stream*.m4s)
    const files = await ff.listDir('/');
    const dashFiles = files.filter(f => f.name === 'manifest.mpd' || f.name.endsWith('.m4s') || f.name.endsWith('.mp4'));
    
    const zipData: Record<string, Uint8Array> = {};
    
    for (const file of dashFiles) {
      const data = await ff.readFile(file.name);
      zipData[file.name] = new Uint8Array(data as Uint8Array);
      await ff.deleteFile(file.name); // Cleanup as we go
    }

    // Zip the files
    const zippedBuffer = fflate.zipSync(zipData);

    // Cleanup input
    await ff.deleteFile(fileName);

    postMessage({ type: 'complete', data: zippedBuffer } as WorkerMessage<Uint8Array>);
  } catch (error) {
    postMessage({ type: 'error', message: String(error), errorCode: 'FFMPEG_COMMAND_FAILED' } as WorkerMessage);
  }
});
