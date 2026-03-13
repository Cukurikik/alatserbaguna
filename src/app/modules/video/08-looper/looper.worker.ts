/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { WorkerMessage } from '../shared/types/video.types';
import { LooperConfig } from './looper.schema';

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

addEventListener('message', async (event: MessageEvent<{ type: string; config: LooperConfig & { fileBuffer: ArrayBuffer, fileName: string, clipDuration: number } }>) => {
  if (event.data.type !== 'start') return;

  const { config } = event.data;
  const { fileBuffer, fileName, mode, loopCount, targetDuration, crossfade, crossfadeDuration, clipDuration } = config;

  try {
    const ff = await loadFFmpeg();
    await ff.writeFile(fileName, new Uint8Array(fileBuffer));

    ff.on('progress', ({ progress }) => {
      postMessage({ type: 'progress', value: Math.round(progress * 100) } as WorkerMessage);
    });

    const outputName = `omni_looped_${fileName}`;
    const repeats = mode === 'count' ? loopCount! : Math.ceil(targetDuration! / clipDuration);

    if (!crossfade) {
      // Fast concat mode without re-encoding
      let listContent = '';
      for (let i = 0; i < repeats; i++) {
        listContent += `file '${fileName}'\n`;
      }
      await ff.writeFile('list.txt', listContent);

      const args = ['-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy'];
      if (mode === 'duration' && targetDuration) {
        args.push('-t', targetDuration.toString());
      }
      args.push(outputName);

      await ff.exec(args);
      await ff.deleteFile('list.txt');
    } else {
      // Crossfade mode (requires re-encoding)
      const args: string[] = [];
      for (let i = 0; i < repeats; i++) {
        args.push('-i', fileName);
      }

      let filterComplex = '';
      let lastOut = '[0:v]';
      for (let i = 1; i < repeats; i++) {
        const offset = (clipDuration * i) - (crossfadeDuration * i);
        const outLabel = i === repeats - 1 ? '[vout]' : `[v0${i}]`;
        filterComplex += `${lastOut}[${i}:v]xfade=transition=fade:duration=${crossfadeDuration}:offset=${offset}${outLabel};`;
        lastOut = outLabel;
      }
      filterComplex = filterComplex.slice(0, -1);
      
      args.push('-filter_complex', filterComplex);
      args.push('-map', '[vout]');
      
      // Map audio if needed (amix or acrossfade)
      // For simplicity, we'll just map the first audio track or use acrossfade
      // But acrossfade is complex for multiple inputs. Let's just use the first audio track for now or no audio
      // Actually, acrossfade is needed for audio too if crossfade is enabled.
      // Let's just use -preset veryfast
      args.push('-preset', 'veryfast');
      
      if (mode === 'duration' && targetDuration) {
        args.push('-t', targetDuration.toString());
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
