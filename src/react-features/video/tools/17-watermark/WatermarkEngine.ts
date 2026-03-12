import { getFFmpegEngine } from '../../shared/engines/ffmpeg.engine';
import { WatermarkOptions } from './watermark.types';

export class WatermarkEngine {
  private ffmpeg = getFFmpegEngine();

  async process(videoFile: File, options: WatermarkOptions): Promise<File> {
    if (!options.watermarkFile) throw new Error('Watermark file is required');
    
    await this.ffmpeg.load();
    
    const videoInput = 'video' + videoFile.name.substring(videoFile.name.lastIndexOf('.'));
    const watermarkInput = 'watermark' + options.watermarkFile.name.substring(options.watermarkFile.name.lastIndexOf('.'));
    const outputName = 'output' + videoFile.name.substring(videoFile.name.lastIndexOf('.'));
    
    await this.ffmpeg.writeFile(videoInput, videoFile);
    await this.ffmpeg.writeFile(watermarkInput, options.watermarkFile);
    
    const posMap = {
      'top-left': `${options.padding}:${options.padding}`,
      'top-right': `main_w-overlay_w-${options.padding}:${options.padding}`,
      'bottom-left': `${options.padding}:main_h-overlay_h-${options.padding}`,
      'bottom-right': `main_w-overlay_w-${options.padding}:main_h-overlay_h-${options.padding}`,
      'center': `(main_w-overlay_w)/2:(main_h-overlay_h)/2`
    };
    
    const overlayPos = posMap[options.position];
    
    // Filter chain: scale watermark, set opacity, then overlay
    const filter = `[1:v]scale=iw*${options.scale}:-1,format=rgba,colorchannelmixer=aa=${options.opacity}[wm];[0:v][wm]overlay=${overlayPos}`;
    
    await this.ffmpeg.run([
      '-i', videoInput,
      '-i', watermarkInput,
      '-filter_complex', filter,
      '-c:a', 'copy',
      outputName
    ]);
    
    const data = await this.ffmpeg.readFile(outputName);
    await this.ffmpeg.deleteFile(videoInput);
    await this.ffmpeg.deleteFile(watermarkInput);
    await this.ffmpeg.deleteFile(outputName);
    
    return new File([data], `watermarked_${videoFile.name}`, { type: videoFile.type });
  }
}
