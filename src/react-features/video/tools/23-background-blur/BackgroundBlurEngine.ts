import { getFFmpegEngine } from '../../engine/FFmpegEngine';
import { BackgroundBlurOptions } from './background-blur.types';
import { fetchFile } from '@ffmpeg/util';

export class BackgroundBlurEngine {
  static async applyBlur(
    videoFile: File,
    options: BackgroundBlurOptions
  ): Promise<Uint8Array> {
    const ffmpeg = await getFFmpegEngine();
    const inputName = 'input_video' + videoFile.name.substring(videoFile.name.lastIndexOf('.'));
    const outputName = 'output_blurred.mp4';

    await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

    // Complex filter to create a blurred background for vertical videos
    // 1. Scale input to fill a 16:9 frame and blur it
    // 2. Scale input to fit height of 16:9 frame
    // 3. Overlay fit on top of blurred background
    const filter = `[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,boxblur=${options.blurAmount}:1[bg];[0:v]scale=-1:1080[fg];[bg][fg]overlay=(W-w)/2:0`;

    await ffmpeg.exec([
      '-i', inputName,
      '-filter_complex', filter,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-c:a', 'copy',
      outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    return data as Uint8Array;
  }
}
