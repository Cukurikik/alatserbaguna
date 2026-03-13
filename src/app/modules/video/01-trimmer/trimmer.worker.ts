/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

addEventListener('message', async (event: MessageEvent) => {
  const { type, config } = event.data;

  if (type === 'start') {
    try {
      if (!ffmpeg) {
        ffmpeg = new FFmpeg();
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
      }

      const { inputFile, startTime, endTime, outputFormat } = config;
      const inputName = `input_${Date.now()}${inputFile.name.substring(inputFile.name.lastIndexOf('.'))}`;
      const outputName = `output_${Date.now()}.${outputFormat}`;

      await ffmpeg.writeFile(inputName, await fetchFile(inputFile));

      const onProgress = ({ progress }: { progress: number }) => {
        postMessage({ type: 'progress', value: Math.round(progress * 100) });
      };
      ffmpeg.on('progress', onProgress);

      const duration = endTime - startTime;
      
      const args = [
        '-ss', startTime.toString(),
        '-i', inputName,
        '-t', duration.toString(),
        '-c', 'copy',
        outputName
      ];

      const code = await ffmpeg.exec(args);

      ffmpeg.off('progress', onProgress);

      if (code === 0) {
        const data = await ffmpeg.readFile(outputName);
        postMessage({ type: 'complete', data: data as Uint8Array }, [ (data as Uint8Array).buffer ]);
      } else {
        postMessage({ type: 'error', errorCode: 'FFMPEG_COMMAND_FAILED' });
      }

      // Cleanup
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

    } catch (error) {
      postMessage({ type: 'error', errorCode: 'WORKER_CRASHED', message: String(error) });
    }
  }
});
