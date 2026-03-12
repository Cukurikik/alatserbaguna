import { getFFmpegEngine } from '../../shared/engines/ffmpeg.engine';
import { FrameExtractorOptions } from './frame-extractor.types';
import JSZip from 'jszip';

export class FrameExtractorEngine {
  private ffmpeg = getFFmpegEngine();

  async process(file: File, options: FrameExtractorOptions, onProgress: (p: number) => void): Promise<File> {
    await this.ffmpeg.load();
    
    const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
    const outputPattern = 'frame_%04d.' + options.format;
    
    await this.ffmpeg.writeFile(inputName, file);
    
    onProgress(20);
    
    await this.ffmpeg.run([
      '-i', inputName,
      '-vf', `fps=${options.fps}`,
      outputPattern
    ]);
    
    onProgress(60);
    
    // Read all generated frames and zip them
    const zip = new JSZip();
    const files = await this.ffmpeg.listDir('.');
    const frameFiles = files.filter(f => f.name.startsWith('frame_') && f.name.endsWith(options.format));
    
    for (const frame of frameFiles) {
      const data = await this.ffmpeg.readFile(frame.name);
      zip.file(frame.name, data);
      await this.ffmpeg.deleteFile(frame.name);
    }
    
    onProgress(90);
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    await this.ffmpeg.deleteFile(inputName);
    
    return new File([zipBlob], 'frames.zip', { type: 'application/zip' });
  }
}
