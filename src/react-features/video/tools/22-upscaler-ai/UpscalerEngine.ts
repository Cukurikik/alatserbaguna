import { getFFmpegEngine } from '../../engine/FFmpegEngine';
import { UpscalerOptions } from './upscaler-ai.types';
import { fetchFile } from '@ffmpeg/util';

export class UpscalerEngine {
  static async upscale(
    videoFile: File,
    options: UpscalerOptions
  ): Promise<Uint8Array> {
    const ffmpeg = await getFFmpegEngine();
    const inputName = 'input_video' + videoFile.name.substring(videoFile.name.lastIndexOf('.'));
    const outputName = 'output_upscaled.mp4';

    await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

    // High quality scaling with lanczos and optional unsharp mask
    let filter = `scale=iw*${options.scale}:ih*${options.scale}:flags=lanczos`;
    if (options.sharpen) {
      filter += ',unsharp=5:5:0.8:5:5:0.8';
    }

    await ffmpeg.exec([
      '-i', inputName,
      '-vf', filter,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '18',
      '-c:a', 'copy',
      outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    return data as Uint8Array;
  }
}
