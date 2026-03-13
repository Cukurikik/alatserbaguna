import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const NoiseRemoverConfigSchema = z.object({
  file: AudioFileSchema,
  format: ExportFormatSchema,
  strength: z.number().min(0).max(97).default(50),  // afftdn nr= parameter: 0-97 dB reduction
  noiseFloor: z.number().min(-100).max(-20).default(-25)  // afftdn nf= parameter
});

export type NoiseRemoverConfig = z.infer<typeof NoiseRemoverConfigSchema>;
