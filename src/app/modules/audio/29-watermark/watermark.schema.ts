import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const WatermarkModeSchema = z.enum(['embed', 'detect']);

export const WatermarkConfigSchema = z.object({
  file: AudioFileSchema,
  format: ExportFormatSchema,
  mode: WatermarkModeSchema,
  watermarkText: z.string().max(128).default(''),
  strength: z.number().min(0.1).max(1.0).default(0.5),
});

export type WatermarkMode = z.infer<typeof WatermarkModeSchema>;
export type WatermarkConfig = z.infer<typeof WatermarkConfigSchema>;
