/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { WorkerMessage } from '../shared/types/video.types';
import { AddSubtitlesConfig } from './add-subtitles.schema';

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

addEventListener('message', async (event: MessageEvent<{ type: string; config: Omit<AddSubtitlesConfig, 'inputFile' | 'subtitleFile'> & { fileBuffer: ArrayBuffer, fileName: string, subtitleBuffer: ArrayBuffer, subtitleFileName: string } }>) => {
  if (event.data.type !== 'start') return;

  const { config } = event.data;
  const { fileBuffer, fileName, subtitleBuffer, subtitleFileName, mode, language } = config;

  try {
    const ff = await loadFFmpeg();
    await ff.writeFile(fileName, new Uint8Array(fileBuffer));
    await ff.writeFile(subtitleFileName, new Uint8Array(subtitleBuffer));

    ff.on('progress', ({ progress }) => {
      postMessage({ type: 'progress', value: Math.round(progress * 100) } as WorkerMessage);
    });

    const outputName = `omni_subbed_${fileName}`;
    const args: string[] = [];

    if (mode === 'hard') {
      // Hardcode subtitles into the video stream
      args.push('-i', fileName);
      args.push('-vf', `subtitles=${subtitleFileName}`);
      args.push('-c:a', 'copy'); // Copy audio
    } else {
      // Softcode subtitles (add as a separate stream)
      args.push('-i', fileName);
      args.push('-i', subtitleFileName);
      args.push('-c', 'copy'); // Copy video and audio
      args.push('-c:s', 'mov_text'); // Encode subtitles for MP4 compatibility
      args.push(`-metadata:s:s:0`, `language=${language}`);
    }

    args.push(outputName);

    await ff.exec(args);

    const data = await ff.readFile(outputName);
    await ff.deleteFile(fileName);
    await ff.deleteFile(subtitleFileName);
    await ff.deleteFile(outputName);

    postMessage({ type: 'complete', data: new Uint8Array(data as Uint8Array) } as WorkerMessage<Uint8Array>);
  } catch (error) {
    postMessage({ type: 'error', message: String(error), errorCode: 'FFMPEG_COMMAND_FAILED' } as WorkerMessage);
  }
});
