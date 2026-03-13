import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const TimeStretchSchema = z.object({
  inputFile: AudioFileSchema,
  outputFormat: ExportFormatSchema,
  speed: z.number().min(0.1).max(4.0).default(1.0),
  pitchLock: z.boolean().default(true),
});

export type TimeStretchConfig = z.infer<typeof TimeStretchSchema>;
