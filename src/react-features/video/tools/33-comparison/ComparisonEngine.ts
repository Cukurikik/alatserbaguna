import { getFFmpegEngine } from '../../shared/engines/ffmpeg.engine';
import { ComparisonOptions } from './comparison.types';

export class ComparisonEngine {
  static async exportComparison(
    videoA: File,
    videoB: File,
    options: ComparisonOptions,
    onProgress: (progress: number) => void
  ): Promise<Uint8Array> {
    const ffmpeg = getFFmpegEngine();
    await ffmpeg.load();
    const nameA = 'video_a' + videoA.name.substring(videoA.name.lastIndexOf('.'));
    const nameB = 'video_b' + videoB.name.substring(videoB.name.lastIndexOf('.'));
    const outputName = 'comparison.mp4';

    await ffmpeg.writeFile(nameA, videoA);
    await ffmpeg.writeFile(nameB, videoB);

    const progressHandler = ({ progress }: { progress: number }) => {
      onProgress(Math.round(progress * 100));
    };
    ffmpeg.on('progress', progressHandler);

    const filter = options.splitMode === 'horizontal' ? 'vstack' : 'hstack';

    try {
      await ffmpeg.run([
        '-i', nameA,
        '-i', nameB,
        '-filter_complex', filter,
        '-c:v', 'libx264',
        outputName
      ]);

      const data = await ffmpeg.readFile(outputName);
      
      await ffmpeg.deleteFile(nameA);
      await ffmpeg.deleteFile(nameB);
      await ffmpeg.deleteFile(outputName);

      return data as Uint8Array;
    } finally {
      ffmpeg.off('progress', progressHandler);
    }
  }
}
