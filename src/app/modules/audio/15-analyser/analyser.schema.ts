import { z } from 'zod';
import { AudioFileSchema } from '../shared/schemas/audio.schemas';

export const AnalyserConfigSchema = z.object({
  file: AudioFileSchema
});

export type AnalyserConfig = z.infer<typeof AnalyserConfigSchema>;

export interface WaveformPeak { min: number; max: number; }
export interface AnalysisResult {
  duration: number;
  sampleRate: number;
  channels: number;
  fileSizeMB: number;
  peaks: WaveformPeak[];      // 2000 sample pairs for full-width waveform
  rmsDb: number;              // RMS loudness in dBFS
  peakDb: number;             // True peak in dBFS
  dynamicRange: number;       // peak - rms
  spectrumBins: number[];     // 128-bin average frequency magnitude (0-1)
}
