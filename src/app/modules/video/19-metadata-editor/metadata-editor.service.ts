import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { VideoMeta, WorkerMessage } from '../shared/types/video.types';

export interface MetadataFields {
  title?: string;
  artist?: string;
  album?: string;
  year?: string;
  description?: string;
  comment?: string;
  genre?: string;
}

export interface MetadataEditorConfig {
  file: File;
  editedFields: MetadataFields;
  stripAll: boolean;
}

@Injectable({ providedIn: 'root' })
export class MetadataEditorService {
  constructor(private bridge: WorkerBridgeService) {}

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

  parseFFprobeJSON(json: string): Partial<VideoMeta> {
    const data = JSON.parse(json);
    const format = data.format ?? {};
    const videoStream = (data.streams ?? []).find((s: Record<string, unknown>) => s['codec_type'] === 'video') ?? {};
    const audioStream = (data.streams ?? []).find((s: Record<string, unknown>) => s['codec_type'] === 'audio') ?? {};
    return {
      filename: format['filename'] as string ?? '',
      fileSizeMB: ((format['size'] as number) ?? 0) / (1024 * 1024),
      duration: parseFloat(format['duration'] as string ?? '0'),
      width: videoStream['width'] as number ?? 0,
      height: videoStream['height'] as number ?? 0,
      fps: this.parseFPS(videoStream['r_frame_rate'] as string ?? '0/1'),
      codec: videoStream['codec_name'] as string ?? '',
      audioCodec: audioStream['codec_name'] as string ?? null,
      audioBitrate: Math.round(((audioStream['bit_rate'] as number) ?? 0) / 1000),
      videoBitrate: Math.round(((videoStream['bit_rate'] as number) ?? 0) / 1000),
      hasAudio: !!audioStream['codec_name'],
      aspectRatio: videoStream['display_aspect_ratio'] as string ?? '',
    };
  }

  buildMetadataArgs(fields: MetadataFields, stripAll: boolean): string[] {
    if (stripAll) return ['-map_metadata', '-1'];
    const args: string[] = [];
    const keys: Array<keyof MetadataFields> = ['title', 'artist', 'album', 'year', 'description', 'comment', 'genre'];
    for (const key of keys) {
      const val = fields[key];
      if (val && val.length > 0) args.push('-metadata', `${key}=${val}`);
    }
    return args;
  }

  process(config: MetadataEditorConfig): Observable<WorkerMessage<ArrayBuffer>> {
    return this.bridge.process<MetadataEditorConfig, ArrayBuffer>(
      () => new Worker(new URL('./metadata-editor.worker', import.meta.url), { type: 'module' }),
      config
    );
  }

  getOutputFilename(originalName: string): string {
    return `omni_meta_${originalName.replace(/\.[^.]+$/, '')}.mp4`;
  }
}