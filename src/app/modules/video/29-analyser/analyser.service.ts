import { Injectable } from '@angular/core';
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
  constructor(private bridge: WorkerBridgeService) {}

  /**
   * Parse FFprobe JSON output into typed stream arrays.
   * Filters streams by codec_type field.
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

  /** Parse r_frame_rate fractional string to float fps. */
  parseFPS(rFrameRate: string): number {
    const [num, den] = rFrameRate.split('/').map(Number);
    if (!den || den === 0) return num;
    return parseFloat((num / den).toFixed(3));
  }

  /** Format raw bps value to human-readable string. */
  formatBitrate(bps: string | number): string {
    const n = typeof bps === 'string' ? parseInt(bps, 10) : bps;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} Mbps`;
    return `${Math.round(n / 1000)} Kbps`;
  }

  analyse(file: File): Observable<WorkerMessage<string>> {
    return this.bridge.process<{ file: File }, string>(
      () => new Worker(new URL('./analyser.worker', import.meta.url), { type: 'module' }),
      { file }
    );
  }
}