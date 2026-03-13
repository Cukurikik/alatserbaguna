import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { VideoMeta, VideoStream, AudioStream, SubtitleStream, WorkerMessage } from '../shared/types/video.types';

export interface AnalyserResult {
  meta: VideoMeta;
  videoStreams: VideoStream[];
  audioStreams: AudioStream[];
  subtitleStreams: SubtitleStream[];
  rawJson: string;
}

@Injectable({ providedIn: 'root' })
export class AnalyserService {
  private readonly bridge = inject(WorkerBridgeService);

  /**
   * Sentry Engine processor.
   */
  analyse(file: File): Observable<WorkerMessage<string>> {
    const worker = new Worker(new URL('./analyser.worker', import.meta.url), { type: 'module' });
    return this.bridge.runTask(worker, { file });
  }

  /**
   * Parse FFprobe JSON output into typed stream arrays.
   */
  parseFFprobeStreams(json: string): Pick<AnalyserResult, 'videoStreams' | 'audioStreams' | 'subtitleStreams'> {
    const data = JSON.parse(json);
    const streams: Record<string, unknown>[] = data.streams ?? [];

    const videoStreams: VideoStream[] = streams
      .filter(s => s['codec_type'] === 'video')
      .map(s => ({
        index: s['index'] as number,
        codec: s['codec_name'] as string,
        width: s['width'] as number,
        height: s['height'] as number,
        fps: this.parseFPS(s['r_frame_rate'] as string ?? '0/1'),
        bitrate: Math.round(((s['bit_rate'] as number) ?? 0) / 1000),
        pixelFormat: s['pix_fmt'] as string ?? '',
        colorSpace: s['color_space'] as string ?? null,
        profile: s['profile'] as string ?? null,
        level: s['level'] !== undefined ? String(s['level']) : null,
      }));

    const audioStreams: AudioStream[] = streams
      .filter(s => s['codec_type'] === 'audio')
      .map(s => ({
        index: s['index'] as number,
        codec: s['codec_name'] as string,
        sampleRate: parseInt(s['sample_rate'] as string ?? '0', 10),
        channels: s['channels'] as number ?? 0,
        bitrate: Math.round(((s['bit_rate'] as number) ?? 0) / 1000),
        language: ((s['tags'] as Record<string, string>)?.['language']) ?? null,
      }));

    const subtitleStreams: SubtitleStream[] = streams
      .filter(s => s['codec_type'] === 'subtitle')
      .map(s => ({
        index: s['index'] as number,
        codec: s['codec_name'] as string,
        language: ((s['tags'] as Record<string, string>)?.['language']) ?? null,
        title: ((s['tags'] as Record<string, string>)?.['title']) ?? null,
        isDefault: (s['disposition'] as Record<string, number>)?.['default'] === 1,
        isForced: (s['disposition'] as Record<string, number>)?.['forced'] === 1,
      }));

    return { videoStreams, audioStreams, subtitleStreams };
  }

  parseFPS(rFrameRate: string): number {
    const [num, den] = rFrameRate.split('/').map(Number);
    if (!den || den === 0) return num;
    return parseFloat((num / den).toFixed(3));
  }

  formatBitrate(bps: string | number): string {
    const n = typeof bps === 'string' ? parseInt(bps, 10) : bps;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} Mbps`;
    return `${Math.round(n / 1000)} Kbps`;
  }
}