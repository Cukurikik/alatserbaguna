import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { WorkerMessage } from '../shared/types/video.types';

export interface ColorGradingConfig {
  brightness: number;   // -1 to 1
  contrast: number;     // 0 to 2
  saturation: number;   // 0 to 2
  hue: number;          // -180 to 180
  gamma: number;        // 0.1 to 3.0
  lutFile?: File | null;
  activeLutPreset: string | null;
}

export interface ColorGradingProcessConfig {
  file: File;
  config: ColorGradingConfig;
  lutFilePath?: string;
}

export interface ColorGradingDefaults {
  brightness: 0; contrast: 1; saturation: 1; hue: 0; gamma: 1.0; activeLutPreset: null;
}

@Injectable({ providedIn: 'root' })
export class ColorGradingService {
  constructor(private bridge: WorkerBridgeService) {}

  /** Build FFmpeg eq filter for basic color adjustments */
  buildFFmpegEqFilter(b: number, c: number, s: number, gamma: number): string {
    return `eq=brightness=${b.toFixed(3)}:contrast=${c.toFixed(3)}:saturation=${s.toFixed(3)}:gamma=${gamma.toFixed(3)}`;
  }

  /** Build FFmpeg hue filter */
  buildHueFilter(hue: number): string {
    return `hue=h=${hue.toFixed(1)}`;
  }

  /** Build FFmpeg lut3d filter for LUT files */
  buildLut3dFilter(lutFilePath: string): string {
    return `lut3d='${lutFilePath}'`;
  }

  /** Chain non-empty filters with comma separator */
  chainFilters(...filters: string[]): string {
    return filters.filter(f => f.length > 0).join(',');
  }

  /**
   * Parse a .cube LUT file into a flat Float32Array for WebGL 3D texture.
   * Validates LUT_3D_SIZE header and parses RGB triplets.
   */
  parseCubeFile(text: string): Float32Array {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let lutSize = 0;
    const triplets: number[] = [];

    for (const line of lines) {
      if (line.startsWith('#')) continue;
      if (line.startsWith('LUT_3D_SIZE')) {
        lutSize = parseInt(line.split(/\s+/)[1], 10);
        continue;
      }
      if (line.startsWith('DOMAIN_MIN') || line.startsWith('DOMAIN_MAX') || line.startsWith('TITLE')) continue;
      const parts = line.split(/\s+/);
      if (parts.length === 3) {
        triplets.push(parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]));
      }
    }

    if (lutSize === 0 || triplets.length !== lutSize * lutSize * lutSize * 3) {
      throw new Error(`Invalid .cube file. Expected ${lutSize}³ × 3 values, got ${triplets.length / 3} triplets.`);
    }
    return new Float32Array(triplets);
  }

  /** Return default color grading values */
  resetToDefaults(): ColorGradingConfig {
    return {
      brightness: 0,
      contrast: 1,
      saturation: 1,
      hue: 0,
      gamma: 1.0,
      lutFile: null,
      activeLutPreset: null,
    };
  }

  process(config: ColorGradingProcessConfig): Observable<WorkerMessage<ArrayBuffer>> {
    return this.bridge.process<ColorGradingProcessConfig, ArrayBuffer>(
      () => new Worker(new URL('./color-grading.worker', import.meta.url), { type: 'module' }),
      config
    );
  }

  getOutputFilename(originalName: string): string {
    const base = originalName.replace(/\.[^.]+$/, '');
    return `omni_graded_${base}.mp4`;
  }
}