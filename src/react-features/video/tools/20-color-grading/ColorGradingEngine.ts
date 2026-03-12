import { getFFmpegEngine } from '../../shared/engines/ffmpeg.engine';
import { ColorGradingOptions } from './color-grading.types';

export class ColorGradingEngine {
  private ffmpeg = getFFmpegEngine();

  async process(file: File, options: ColorGradingOptions): Promise<File> {
    await this.ffmpeg.load();
    
    const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
    const outputName = 'output' + file.name.substring(file.name.lastIndexOf('.'));
    
    await this.ffmpeg.writeFile(inputName, file);
    
    // eq filter: brightness, contrast, saturation, gamma
    // hue filter: h (degrees)
    const eqFilter = `eq=brightness=${options.brightness}:contrast=${options.contrast}:saturation=${options.saturation}:gamma=${options.gamma}`;
    const hueFilter = `hue=h=${options.hue}`;
    
    await this.ffmpeg.run([
      '-i', inputName,
      '-vf', `${eqFilter},${hueFilter}`,
      '-c:a', 'copy',
      outputName
    ]);
    
    const data = await this.ffmpeg.readFile(outputName);
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);
    
    return new File([data], `graded_${file.name}`, { type: file.type });
  }
}
