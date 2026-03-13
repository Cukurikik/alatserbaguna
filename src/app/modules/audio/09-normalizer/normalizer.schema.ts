import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const NormalizerSchema = z.object({
  inputFile: AudioFileSchema,
  outputFormat: ExportFormatSchema,
  mode: z.enum(['peak', 'rms', 'lufs']).default('lufs'),
  targetLevel: z.number().min(-40).max(0).default(-14),
  truePeakEnabled: z.boolean().default(false),
});

export type NormalizerConfig = z.infer<typeof NormalizerSchema>;
