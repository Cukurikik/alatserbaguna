import { getFFmpegEngine } from '../../engine/FFmpegEngine';
import { DenoiserOptions } from './denoiser.types';
import { fetchFile } from '@ffmpeg/util';

export class DenoiserEngine {
  static async denoise(
    videoFile: File,
    options: DenoiserOptions
  ): Promise<Uint8Array> {
    const ffmpeg = await getFFmpegEngine();
    const inputName = 'input_video' + videoFile.name.substring(videoFile.name.lastIndexOf('.'));
    const outputName = 'output_denoised.mp4';

    await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

    let filter = '';
    if (options.method === 'hqdn3d') {
      // hqdn3d=luma_spatial:chroma_spatial:luma_tmp:chroma_tmp
      const s = options.strength * 2;
      filter = `hqdn3d=${s}:${s}:${s*1.5}:${s*1.5}`;
    } else {
      // nlmeans=s:p:r
      const s = options.strength / 10;
      filter = `nlmeans=s=${s}`;
    }

    await ffmpeg.exec([
      '-i', inputName,
      '-vf', filter,
      '-c:a', 'copy',
      outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    return data as Uint8Array;
  }
}
