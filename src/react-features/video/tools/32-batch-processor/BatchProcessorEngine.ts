import { getFFmpegEngine } from '../../shared/engines/ffmpeg.engine';
import { BatchProcessorOptions } from './batch-processor.types';

export class BatchProcessorEngine {
  static async processBatch(
    files: File[],
    options: BatchProcessorOptions,
    onProgress: (progress: number) => void
  ): Promise<Uint8Array[]> {
    const ffmpeg = getFFmpegEngine();
    await ffmpeg.load();
    const results: Uint8Array[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const inputName = `input_${i}` + file.name.substring(file.name.lastIndexOf('.'));
      let outputName = `output_${i}.mp4`;

      await ffmpeg.writeFile(inputName, file);

      if (options.operation === 'extract-audio') {
        outputName = `output_${i}.mp3`;
        await ffmpeg.run(['-i', inputName, '-q:a', '0', '-map', 'a', outputName]);
      } else {
        // Default to simple copy for now as a placeholder for other operations
        await ffmpeg.run(['-i', inputName, '-c', 'copy', outputName]);
      }

      const data = await ffmpeg.readFile(outputName);
      results.push(data as Uint8Array);

      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      onProgress(Math.round(((i + 1) / files.length) * 100));
    }

    return results;
  }
}
