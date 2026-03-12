import { getFFmpegEngine } from '../../shared/engines/ffmpeg.engine';
import { GifConverterOptions } from './gif-converter.types';

export class GifConverterEngine {
  private ffmpeg = getFFmpegEngine();

  async process(file: File, options: GifConverterOptions): Promise<File> {
    await this.ffmpeg.load();
    
    const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
    const outputName = 'output.gif';
    const paletteName = 'palette.png';
    
    await this.ffmpeg.writeFile(inputName, file);
    
    // High quality GIF generation
    await this.ffmpeg.run([
      '-i', inputName,
      '-vf', `fps=${options.fps},scale=${options.width}:-1:flags=lanczos,palettegen`,
      paletteName
    ]);
    
    await this.ffmpeg.run([
      '-i', inputName,
      '-i', paletteName,
      '-filter_complex', `fps=${options.fps},scale=${options.width}:-1:flags=lanczos[x];[x][1:v]paletteuse`,
      outputName
    ]);
    
    const data = await this.ffmpeg.readFile(outputName);
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);
    await this.ffmpeg.deleteFile(paletteName);
    
    return new File([data], 'converted.gif', { type: 'image/gif' });
  }
}
