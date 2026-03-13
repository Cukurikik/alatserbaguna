/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { WorkerMessage } from '../shared/types/video.types';
import { VideoToHlsConfig } from './video-to-hls.schema';
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

addEventListener('message', async (event: MessageEvent<{ type: string; config: VideoToHlsConfig & { fileBuffer: ArrayBuffer, fileName: string } }>) => {
  if (event.data.type !== 'start') return;

  const { config } = event.data;
  const { fileBuffer, fileName, segmentDuration, preset } = config;

  try {
    const ff = await loadFFmpeg();
    await ff.writeFile(fileName, new Uint8Array(fileBuffer));

    ff.on('progress', ({ progress }) => {
      postMessage({ type: 'progress', value: Math.round(progress * 100) } as WorkerMessage);
    });

    const outputPlaylist = 'playlist.m3u8';
    
    const args = [
      '-i', fileName,
      '-profile:v', 'baseline',
      '-level', '3.0',
      '-s', '854x480', // Default to 480p for basic HLS
      '-start_number', '0',
      '-hls_time', segmentDuration.toString(),
      '-hls_list_size', '0',
      '-f', 'hls',
      '-preset', preset,
      outputPlaylist
    ];

    await ff.exec(args);

    // Read all generated files (playlist.m3u8 and playlist*.ts)
    const files = await ff.listDir('/');
    const hlsFiles = files.filter(f => f.name.startsWith('playlist') && (f.name.endsWith('.m3u8') || f.name.endsWith('.ts')));
    
    const zipData: Record<string, Uint8Array> = {};
    
    for (const file of hlsFiles) {
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
