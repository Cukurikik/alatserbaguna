import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

// 10-band equalizer gains in dB (-20 to 20)
export const EqualizerConfigSchema = z.object({
  file: AudioFileSchema,
  format: ExportFormatSchema,
  bands: z.object({
    hz31: z.number().min(-20).max(20).default(0),
    hz62: z.number().min(-20).max(20).default(0),
    hz125: z.number().min(-20).max(20).default(0),
    hz250: z.number().min(-20).max(20).default(0),
    hz500: z.number().min(-20).max(20).default(0),
    hz1k: z.number().min(-20).max(20).default(0),
    hz2k: z.number().min(-20).max(20).default(0),
    hz4k: z.number().min(-20).max(20).default(0),
    hz8k: z.number().min(-20).max(20).default(0),
    hz16k: z.number().min(-20).max(20).default(0),
  })
});

export type EqualizerConfig = z.infer<typeof EqualizerConfigSchema>;
export type EqBands = EqualizerConfig['bands'];
