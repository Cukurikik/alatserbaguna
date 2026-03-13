import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const FadeSchema = z.object({
  inputFile: AudioFileSchema,
  outputFormat: ExportFormatSchema,
  fadeInDuration: z.number().min(0).max(30).default(2),
  fadeOutDuration: z.number().min(0).max(30).default(2),
  curve: z.enum(['linear', 'logarithmic', 'sCurve']).default('sCurve'),
});

export type FadeConfig = z.infer<typeof FadeSchema>;
