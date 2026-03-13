/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { WorkerMessage } from '../shared/types/video.types';
import { ExtractAudioConfig } from './extract-audio.schema';

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

function getAudioCodec(format: string): string {
  switch (format) {
    case 'mp3': return 'libmp3lame';
    case 'wav': return 'pcm_s16le';
    case 'aac': return 'aac';
    case 'ogg': return 'libvorbis';
    default: return 'libmp3lame';
  }
}

addEventListener('message', async (event: MessageEvent<{ type: string; config: ExtractAudioConfig & { fileBuffer: ArrayBuffer, fileName: string } }>) => {
  if (event.data.type !== 'start') return;

  const { config } = event.data;
  const { fileBuffer, fileName, format, bitrate } = config;

  try {
    const ff = await loadFFmpeg();
    await ff.writeFile(fileName, new Uint8Array(fileBuffer));

    ff.on('progress', ({ progress }) => {
      postMessage({ type: 'progress', value: Math.round(progress * 100) } as WorkerMessage);
    });

    const outputName = `omni_audio_${fileName.split('.')[0]}.${format}`;
    const args = ['-i', fileName];

    // Extract audio only
    args.push('-vn'); // No video
    
    const codec = getAudioCodec(format);
    args.push('-acodec', codec);

    if (format !== 'wav') {
      args.push('-b:a', `${bitrate}k`);
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
