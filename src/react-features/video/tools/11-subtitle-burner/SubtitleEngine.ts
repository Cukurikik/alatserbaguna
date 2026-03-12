import { getFFmpegEngine } from '../../shared/engines/ffmpeg.engine';
import { SubtitleOptions } from './subtitle-burner.types';

export class SubtitleEngine {
  private ffmpeg = getFFmpegEngine();

  async process(videoFile: File, options: SubtitleOptions, onProgress: (p: number) => void): Promise<File> {
    await this.ffmpeg.load();
    
    const videoInputName = 'video' + videoFile.name.substring(videoFile.name.lastIndexOf('.'));
    const subInputName = 'subs' + options.subtitleFile!.name.substring(options.subtitleFile!.name.lastIndexOf('.'));
    const outputName = `output.${options.outputFormat}`;
    
    await this.ffmpeg.writeFile(videoInputName, videoFile);
    await this.ffmpeg.writeFile(subInputName, options.subtitleFile!);
    
    this.ffmpeg.on('progress', ({ progress }: { progress: number }) => {
      onProgress(Math.round(progress * 100));
    });
    
    // Burning subtitles requires re-encoding
    // Note: FFmpeg subtitles filter needs the path to be escaped or simple
    await this.ffmpeg.run([
      '-i', videoInputName,
      '-vf', `subtitles=${subInputName}`,
      outputName
    ]);
    
    const data = await this.ffmpeg.readFile(outputName);
    await this.ffmpeg.deleteFile(videoInputName);
    await this.ffmpeg.deleteFile(subInputName);
    await this.ffmpeg.deleteFile(outputName);
    
    return new File([data], `subtitled_${videoFile.name}`, { type: `video/${options.outputFormat}` });
  }
}
