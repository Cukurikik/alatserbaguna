import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const SpeedSchema = z.object({
  file: AudioFileSchema,
  format: ExportFormatSchema,
  speed: z.number().min(0.1).max(4.0).default(1.5),
  pitchLock: z.boolean().default(true),
});

export type SpeedConfig = z.infer<typeof SpeedSchema>;
