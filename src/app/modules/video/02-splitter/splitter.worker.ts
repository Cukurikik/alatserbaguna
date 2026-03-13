/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { WorkerMessage } from '../shared/types/video.types';
import { SplitterConfig } from './splitter.schema';
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

addEventListener('message', async (event: MessageEvent<{ type: string; config: SplitterConfig & { fileBuffer: ArrayBuffer, fileName: string, duration: number } }>) => {
  if (event.data.type !== 'start') return;

  const { config } = event.data;
  const { fileBuffer, fileName, parts, duration } = config;

  try {
    const ff = await loadFFmpeg();
    await ff.writeFile(fileName, new Uint8Array(fileBuffer));

    const partDuration = duration / parts;
    const zipData: Record<string, Uint8Array> = {};

    for (let i = 0; i < parts; i++) {
      const startTime = i * partDuration;
      const outputName = `part_${i + 1}_${fileName}`;
      
      postMessage({ type: 'progress', value: Math.round((i / parts) * 100) } as WorkerMessage);

      const args = [
        '-ss', startTime.toString(),
        '-i', fileName,
        '-t', partDuration.toString(),
        '-c', 'copy',
        outputName
      ];

      await ff.exec(args);
      const data = await ff.readFile(outputName);
      zipData[outputName] = new Uint8Array(data as Uint8Array);
      await ff.deleteFile(outputName);
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
