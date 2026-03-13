/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { WorkerMessage } from '../shared/types/video.types';
import { ToAudioConfig } from './to-audio.schema';

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

addEventListener('message', async (event: MessageEvent<{ type: string; config: ToAudioConfig & { fileBuffer: ArrayBuffer, fileName: string } }>) => {
  if (event.data.type !== 'start') return;

  const { config } = event.data;
  const { fileBuffer, fileName, format, quality } = config;

  try {
    const ff = await loadFFmpeg();
    await ff.writeFile(fileName, new Uint8Array(fileBuffer));

    ff.on('progress', ({ progress }) => {
      postMessage({ type: 'progress', value: Math.round(progress * 100) } as WorkerMessage);
    });

    const outputName = `omni_audio.${format}`;
    const args = ['-i', fileName];

    // Audio codec mapping
    let codec = '';
    let bitrate = '';

    switch (format) {
      case 'mp3':
        codec = 'libmp3lame';
        bitrate = quality === 'high' ? '320k' : quality === 'medium' ? '192k' : '128k';
        break;
      case 'wav':
        codec = 'pcm_s16le';
        break;
      case 'aac':
        codec = 'aac';
        bitrate = quality === 'high' ? '256k' : quality === 'medium' ? '128k' : '64k';
        break;
      case 'ogg':
        codec = 'libvorbis';
        bitrate = quality === 'high' ? '256k' : quality === 'medium' ? '128k' : '64k';
        break;
      case 'flac':
        codec = 'flac';
        break;
    }

    args.push('-vn'); // Disable video
    args.push('-c:a', codec);
    
    if (bitrate && format !== 'wav' && format !== 'flac') {
      args.push('-b:a', bitrate);
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
