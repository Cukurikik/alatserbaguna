import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

// FFmpeg acompressor parameters
// threshold: 0.000976563 to 1 (default 0.125) equivalent to -60dB to 0dB
// ratio: 1 to 20 (default 2)
// attack: 0.01 to 2000 ms (default 20)
// release: 0.01 to 9000 ms (default 250)
// makeup: 1 to 64 (default 1) equivalent to 0dB to ~36dB

export const CompressorConfigSchema = z.object({
  file: AudioFileSchema,
  format: ExportFormatSchema,
  thresholdDb: z.number().min(-60).max(0).default(-20),
  ratio: z.number().min(1).max(20).default(4),
  attackMs: z.number().min(0.01).max(2000).default(20),
  releaseMs: z.number().min(0.01).max(9000).default(250),
  makeupGainDb: z.number().min(0).max(24).default(0)
});

export type CompressorConfig = z.infer<typeof CompressorConfigSchema>;
