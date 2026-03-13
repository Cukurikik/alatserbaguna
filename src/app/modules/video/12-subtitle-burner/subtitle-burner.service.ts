import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage } from '../shared/types/video.types';

export interface SRTCue {
  index: number;
  startTime: number;  // seconds
  endTime: number;    // seconds
  text: string;
}

export interface SubtitleConfig {
  videoFile: File;
  subtitleContent: string;
  fontFamily: string;
  fontSize: number;
  fontColor: string;    // hex #RRGGBB
  outlineColor: string; // hex #RRGGBB
  position: 'top' | 'bottom';
  offsetSeconds: number;
}

@Injectable({ providedIn: 'root' })
export class SubtitleBurnerService {
  constructor(private bridge: WorkerBridgeService) {}

  /**
   * Parse SRT file content into cue array.
   * Handles standard SRT timestamp format: HH:MM:SS,mmm
   */
  parseSRT(content: string): SRTCue[] {
    const SRT_BLOCK_REGEX = /(\d+)\n(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})\n([\s\S]*?)(?=\n\d+\n|$)/g;
    const cues: SRTCue[] = [];
    let match: RegExpExecArray | null;

    while ((match = SRT_BLOCK_REGEX.exec(content)) !== null) {
      cues.push({
        index: parseInt(match[1], 10),
        startTime: this.srtTimestampToSeconds(match[2]),
        endTime: this.srtTimestampToSeconds(match[3]),
        text: match[4].trim(),
      });
    }
    return cues;
  }

  /**
   * Convert SRT timestamp string to seconds (float).
   * Input format: "HH:MM:SS,mmm"
   */
  srtTimestampToSeconds(ts: string): number {
    const [timePart, msPart] = ts.split(',');
    const [h, m, s] = timePart.split(':').map(Number);
    return h * 3600 + m * 60 + s + Number(msPart) / 1000;
  }

  /**
   * Apply a time offset to all cues. Clamps to minimum 0.
   */
  applyOffset(cues: SRTCue[], offsetSeconds: number): SRTCue[] {
    return cues.map(cue => ({
      ...cue,
      startTime: Math.max(0, cue.startTime + offsetSeconds),
      endTime: Math.max(0, cue.endTime + offsetSeconds),
    }));
  }

  /**
   * Build the FFmpeg drawtext/subtitles force_style string.
   * Converts hex colors (#RRGGBB) to ASS format (&HAABBGGRR).
   */
  buildForceStyle(
    fontFamily: string,
    fontSize: number,
    fontColor: string,
    outlineColor: string,
    position: 'top' | 'bottom'
  ): string {
    const toASS = (hex: string): string => {
      const r = hex.slice(1, 3);
      const g = hex.slice(3, 5);
      const b = hex.slice(5, 7);
      return `&H00${b}${g}${r}`.toUpperCase();
    };
    const marginV = position === 'top' ? -30 : 30;
    return [
      `FontName=${fontFamily}`,
      `FontSize=${fontSize}`,
      `PrimaryColour=${toASS(fontColor)}`,
      `OutlineColour=${toASS(outlineColor)}`,
      `Outline=2`,
      `Shadow=1`,
      `Alignment=${position === 'top' ? 8 : 2}`,
      `MarginV=${marginV}`,
    ].join(',');
  }

  process(config: SubtitleConfig): Observable<WorkerMessage<ArrayBuffer>> {
    return this.bridge.runTask(new Worker(new URL('./subtitle-burner.worker', import.meta.url), { type: 'module' }), config);
  }

  getOutputFilename(originalName: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_subtitled_${base}.mp4`;
  }
}