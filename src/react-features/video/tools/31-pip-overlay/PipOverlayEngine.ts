import { getFFmpegEngine } from '../../shared/engines/ffmpeg.engine';
import { PipOverlayOptions } from './pip-overlay.types';

export class PipOverlayEngine {
  static async applyOverlay(
    mainVideo: File,
    overlayVideo: File,
    options: PipOverlayOptions,
    onProgress: (progress: number) => void
  ): Promise<Uint8Array> {
    const ffmpeg = getFFmpegEngine();
    await ffmpeg.load();
    const mainName = 'main' + mainVideo.name.substring(mainVideo.name.lastIndexOf('.'));
    const overlayName = 'overlay' + overlayVideo.name.substring(overlayVideo.name.lastIndexOf('.'));
    const outputName = 'output_pip.mp4';

    await ffmpeg.writeFile(mainName, mainVideo);
    await ffmpeg.writeFile(overlayName, overlayVideo);

    const progressHandler = ({ progress }: { progress: number }) => {
      onProgress(Math.round(progress * 100));
    };
    ffmpeg.on('progress', progressHandler);

    // Simple overlay filter
    // scale2ref scales the overlay relative to the main video
    const filter = `[1:v][0:v]scale2ref=w=iw*${options.scale}:h=ih*${options.scale}[ovrl][main];[main][ovrl]overlay=${options.x}:${options.y}`;

    try {
      await ffmpeg.run([
        '-i', mainName,
        '-i', overlayName,
        '-filter_complex', filter,
        '-c:a', 'copy',
        outputName
      ]);

      const data = await ffmpeg.readFile(outputName);
      
      await ffmpeg.deleteFile(mainName);
      await ffmpeg.deleteFile(overlayName);
      await ffmpeg.deleteFile(outputName);

      return data as Uint8Array;
    } finally {
      ffmpeg.off('progress', progressHandler);
    }
  }
}
