import { getFFmpegEngine } from '../../shared/engines/ffmpeg.engine';
import { GifOptions } from './gif-maker.types';

export class GifEngine {
  private ffmpeg = getFFmpegEngine();

  async process(file: File, options: GifOptions): Promise<File> {
    await this.ffmpeg.load();
    
    const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
    const outputName = 'output.gif';
    const paletteName = 'palette.png';
    
    await this.ffmpeg.writeFile(inputName, file);
    
    // High quality GIF generation using palettegen
    // Step 1: Generate palette
    await this.ffmpeg.run([
      '-ss', options.startTime.toString(),
      '-t', options.duration.toString(),
      '-i', inputName,
      '-vf', `fps=${options.fps},scale=${options.width}:-1:flags=lanczos,palettegen`,
      paletteName
    ]);
    
    // Step 2: Generate GIF using palette
    await this.ffmpeg.run([
      '-ss', options.startTime.toString(),
      '-t', options.duration.toString(),
      '-i', inputName,
      '-i', paletteName,
      '-filter_complex', `fps=${options.fps},scale=${options.width}:-1:flags=lanczos[x];[x][1:v]paletteuse`,
      outputName
    ]);
    
    const data = await this.ffmpeg.readFile(outputName);
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);
    await this.ffmpeg.deleteFile(paletteName);
    
    return new File([data], 'animation.gif', { type: 'image/gif' });
  }
}
