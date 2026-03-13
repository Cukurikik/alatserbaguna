import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const NormalizerConfigSchema = z.object({
  file: AudioFileSchema,
  format: ExportFormatSchema,
  mode: z.enum(['peak', 'lufs']),
  targetLevel: z.number().min(-60).max(0).default(-3),     // For peak: usually -3dB to 0dB. For LUFS: usually -23, -14, etc.
  truePeak: z.number().min(-10).max(0).default(-1)         // Only used in LUFS mode (EBU R128)
});

export type NormalizerConfig = z.infer<typeof NormalizerConfigSchema>;
