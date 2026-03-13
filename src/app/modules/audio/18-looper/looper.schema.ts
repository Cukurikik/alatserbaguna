import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const LooperConfigSchema = z.object({
  file: AudioFileSchema,
  format: ExportFormatSchema,
  repeatCount: z.number().min(2).max(50).default(4),
  crossfadeDurationSec: z.number().min(0).max(5).default(0.5),
});

export type LooperConfig = z.infer<typeof LooperConfigSchema>;
