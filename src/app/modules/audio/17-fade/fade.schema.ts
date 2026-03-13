import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const FadeConfigSchema = z.object({
  file: AudioFileSchema,
  format: ExportFormatSchema,
  fadeInDuration: z.number().min(0).max(30).default(2),    // seconds
  fadeOutDuration: z.number().min(0).max(30).default(2),   // seconds
  curve: z.enum(['linear', 'logarithmic', 'sCurve']).default('sCurve')
});

export type FadeCurve = 'linear' | 'logarithmic' | 'sCurve';
export type FadeConfig = z.infer<typeof FadeConfigSchema>;
