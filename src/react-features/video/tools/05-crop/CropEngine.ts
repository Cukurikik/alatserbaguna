import { FFmpegEngine } from '../../shared/engines/ffmpeg.engine';
import { CropOptions } from './crop.types';

export class CropEngine {
  static async cropVideo(
    engine: FFmpegEngine,
    inputFile: File,
    options: CropOptions,
    onProgress: (progress: number) => void
  ): Promise<Blob> {
    const inputName = 'input_crop' + inputFile.name.substring(inputFile.name.lastIndexOf('.'));
    const outputName = 'output_crop.mp4';

    await engine.writeFile(inputName, inputFile);

    const progressHandler = ({ progress }: { progress: number }) => {
      onProgress(progress * 100);
    };
    engine.on('progress', progressHandler);

    // FFmpeg crop filter: crop=w:h:x:y
    const cropFilter = `crop=${options.width}:${options.height}:${options.x}:${options.y}`;

    try {
      await engine.run([
        '-i', inputName,
        '-vf', cropFilter,
        '-c:a', 'copy', // Copy audio without re-encoding
        outputName
      ]);

      const data = await engine.readFile(outputName);
      
      // Cleanup
      await engine.deleteFile(inputName);
      await engine.deleteFile(outputName);

      return new Blob([data as BlobPart], { type: 'video/mp4' });
    } finally {
      engine.off('progress', progressHandler);
    }
  }
}
