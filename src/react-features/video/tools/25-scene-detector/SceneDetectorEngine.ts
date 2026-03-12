import { getFFmpegEngine } from '../../engine/FFmpegEngine';
import { SceneDetectorOptions, SceneChange } from './scene-detector.types';
import { fetchFile } from '@ffmpeg/util';

export class SceneDetectorEngine {
  static async detectScenes(
    videoFile: File,
    options: SceneDetectorOptions
  ): Promise<SceneChange[]> {
    const ffmpeg = await getFFmpegEngine();
    const inputName = 'input_video' + videoFile.name.substring(videoFile.name.lastIndexOf('.'));

    await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

    const sceneChanges: SceneChange[] = [];

    ffmpeg.on('log', ({ message }) => {
      // Example log: [scdet @ 0x...] lavfi.scdet.score: 12.345, lavfi.scdet.time: 1.234
      const timeMatch = message.match(/lavfi\.scdet\.time:\s*([\d.]+)/);
      if (timeMatch) {
        sceneChanges.push({
          timestamp: parseFloat(timeMatch[1]),
          frame: 0 // Frame number not always available in simple log
        });
      }
    });

    // scdet=threshold=10
    const filter = `scdet=threshold=${options.threshold}`;

    await ffmpeg.exec([
      '-i', inputName,
      '-vf', filter,
      '-f', 'null',
      '-'
    ]);

    await ffmpeg.deleteFile(inputName);

    return sceneChanges;
  }
}
