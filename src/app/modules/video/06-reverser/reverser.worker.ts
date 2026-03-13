/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { WorkerMessage } from '../shared/types/video.types';
import { ReverserConfig } from './reverser.schema';

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

addEventListener('message', async (event: MessageEvent<{ type: string; config: ReverserConfig & { fileBuffer: ArrayBuffer, fileName: string, duration: number } }>) => {
  if (event.data.type !== 'start') return;

  const { config } = event.data;
  const { fileBuffer, fileName, reverseAudio, duration } = config;

  try {
    const ff = await loadFFmpeg();
    await ff.writeFile(fileName, new Uint8Array(fileBuffer));

    ff.on('progress', ({ progress }) => {
      postMessage({ type: 'progress', value: Math.round(progress * 100) } as WorkerMessage);
    });

    const outputName = `omni_reversed_${fileName}`;

    if (duration > 120) {
      // Segmented reverse
      const segmentDuration = 30;
      const segmentCount = Math.ceil(duration / segmentDuration);
      const reversedSegments: string[] = [];

      for (let i = 0; i < segmentCount; i++) {
        const start = i * segmentDuration;
        const end = Math.min((i + 1) * segmentDuration, duration);
        const segName = `seg_${i}.mp4`;
        const revSegName = `rev_seg_${i}.mp4`;

        // Extract segment
        await ff.exec(['-i', fileName, '-ss', start.toString(), '-to', end.toString(), '-c', 'copy', segName]);

        // Reverse segment
        const reverseArgs = ['-i', segName, '-vf', 'reverse'];
        if (reverseAudio) {
          reverseArgs.push('-af', 'areverse');
        } else {
          reverseArgs.push('-c:a', 'copy');
        }
        reverseArgs.push('-preset', 'ultrafast', revSegName);
        await ff.exec(reverseArgs);

        reversedSegments.push(revSegName);
        await ff.deleteFile(segName);
      }

      // Concat reversed segments in reverse order
      const listContent = reversedSegments.reverse().map(name => `file '${name}'`).join('\n');
      await ff.writeFile('list.txt', listContent);
      await ff.exec(['-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', outputName]);

      for (const name of reversedSegments) {
        await ff.deleteFile(name);
      }
      await ff.deleteFile('list.txt');

    } else {
      // Single pass reverse
      const args = ['-i', fileName, '-vf', 'reverse'];
      if (reverseAudio) {
        args.push('-af', 'areverse');
      } else {
        args.push('-c:a', 'copy');
      }
      args.push(outputName);
      await ff.exec(args);
    }

    const data = await ff.readFile(outputName);
    await ff.deleteFile(fileName);
    await ff.deleteFile(outputName);

    postMessage({ type: 'complete', data: new Uint8Array(data as Uint8Array) } as WorkerMessage<Uint8Array>);
  } catch (error) {
    postMessage({ type: 'error', message: String(error), errorCode: 'FFMPEG_COMMAND_FAILED' } as WorkerMessage);
  }
});
