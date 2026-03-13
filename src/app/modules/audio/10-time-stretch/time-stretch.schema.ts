import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const TimeStretchConfigSchema = z.object({
  file: AudioFileSchema,
  format: ExportFormatSchema,
  speed: z.number().min(0.1).max(4.0).default(1.0),
  pitchLock: z.boolean().default(true), // if true -> use atempo (time-stretch, keeps pitch). if false -> use asetrate (vinyl speed effect, pitch scales with speed)
  targetBpm: z.number().min(30).max(300).optional(),
  originalBpm: z.number().min(30).max(300).optional()
});

export type TimeStretchConfig = z.infer<typeof TimeStretchConfigSchema>;
