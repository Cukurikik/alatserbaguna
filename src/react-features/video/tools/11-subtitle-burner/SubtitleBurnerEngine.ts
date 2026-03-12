import { getFFmpegEngine } from '../../engine/FFmpegEngine';
import { SubtitleBurnerOptions } from './subtitle-burner.types';
import { fetchFile } from '@ffmpeg/util';

export class SubtitleBurnerEngine {
  static async burnSubtitles(
    videoFile: File,
    options: SubtitleBurnerOptions
  ): Promise<Uint8Array> {
    const ffmpeg = await getFFmpegEngine();
    const inputName = 'input_video' + videoFile.name.substring(videoFile.name.lastIndexOf('.'));
    const subName = options.subtitleFile?.name || 'subtitles.srt';
    const outputName = 'output_burned.mp4';

    await ffmpeg.writeFile(inputName, await fetchFile(videoFile));
    if (options.subtitleFile) {
      await ffmpeg.writeFile(subName, await fetchFile(options.subtitleFile));
    }

    ffmpeg.on('log', ({ message }) => {
      console.log(message);
    });

    // FFmpeg subtitle filter syntax: subtitles=filename:force_style='Fontname=Arial,Fontsize=24,PrimaryColour=&H0000ff'
    // PrimaryColour is in BGR hex format: &H<alpha><blue><green><red>
    const fontName = options.fontName || 'Arial';
    const fontSize = options.fontSize || 24;
    const primaryColor = options.fontColor ? this.hexToAssColor(options.fontColor) : '&H00FFFFFF';
    const outlineColor = options.outlineColor ? this.hexToAssColor(options.outlineColor) : '&H00000000';
    const outlineWidth = options.outlineWidth || 1;

    const filter = `subtitles=${subName}:force_style='Fontname=${fontName},Fontsize=${fontSize},PrimaryColour=${primaryColor},OutlineColour=${outlineColor},Outline=${outlineWidth}'`;

    await ffmpeg.exec([
      '-i', inputName,
      '-vf', filter,
      '-c:a', 'copy',
      outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    
    // Cleanup
    await ffmpeg.deleteFile(inputName);
    if (options.subtitleFile) await ffmpeg.deleteFile(subName);
    await ffmpeg.deleteFile(outputName);

    return data as Uint8Array;
  }

  private static hexToAssColor(hex: string): string {
    // Convert #RRGGBB to &H00BBGGRR
    const r = hex.substring(1, 3);
    const g = hex.substring(3, 5);
    const b = hex.substring(5, 7);
    return `&H00${b}${g}${r}`;
  }
}
