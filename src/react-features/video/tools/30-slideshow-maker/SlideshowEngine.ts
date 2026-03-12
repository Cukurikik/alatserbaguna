import { getFFmpegEngine } from '../../engine/FFmpegEngine';
import { SlideshowOptions } from './slideshow-maker.types';
import { fetchFile } from '@ffmpeg/util';

export class SlideshowEngine {
  static async createSlideshow(
    images: File[],
    options: SlideshowOptions
  ): Promise<Uint8Array> {
    const ffmpeg = await getFFmpegEngine();
    const outputName = 'slideshow.mp4';
    const res = options.outputResolution === '1080p' ? '1920:1080' : '1280:720';

    // Write all images to VFS
    for (let i = 0; i < images.length; i++) {
      await ffmpeg.writeFile(`img_${i}.jpg`, await fetchFile(images[i]));
    }

    // Simple slideshow: scale and concatenate
    // For transitions, we'd need a more complex filter_complex
    let filter = '';
    for (let i = 0; i < images.length; i++) {
      filter += `[${i}:v]scale=${res}:force_original_aspect_ratio=decrease,pad=${res}:(ow-iw)/2:(oh-ih)/2,setsar=1,duration=${options.durationPerImage}[v${i}];`;
    }
    
    const inputs = images.map((_, i) => `[v${i}]`).join('');
    filter += `${inputs}concat=n=${images.length}:v=1:a=0[outv]`;

    const args = [];
    for (let i = 0; i < images.length; i++) {
      args.push('-i', `img_${i}.jpg`);
    }
    args.push('-filter_complex', filter, '-map', '[outv]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', outputName);

    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(outputName);
    
    // Cleanup
    for (let i = 0; i < images.length; i++) {
      await ffmpeg.deleteFile(`img_${i}.jpg`);
    }
    await ffmpeg.deleteFile(outputName);

    return data as Uint8Array;
  }
}
