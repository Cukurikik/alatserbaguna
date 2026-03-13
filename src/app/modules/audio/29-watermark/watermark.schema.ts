import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const WatermarkSchema = z.object({
  inputFile: AudioFileSchema,
  outputFormat: ExportFormatSchema,
  mode: z.enum(['embed', 'detect']).default('embed'),
  watermarkText: z.string().max(128).default(''),
  strength: z.number().min(0.1).max(1.0).default(0.5),
});

export type WatermarkConfig = z.infer<typeof WatermarkSchema>;
