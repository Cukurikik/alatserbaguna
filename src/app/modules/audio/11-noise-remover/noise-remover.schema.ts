import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const NoiseRemoverSchema = z.object({
  inputFile: AudioFileSchema,
  outputFormat: ExportFormatSchema,
  algorithm: z.enum(['spectral', 'ai', 'ffmpeg']).default('ffmpeg'),
  strength: z.number().min(0).max(1).default(0.5),
});

export type NoiseRemoverConfig = z.infer<typeof NoiseRemoverSchema>;
