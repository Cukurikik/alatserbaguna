import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const MergerSchema = z.object({
  inputFile: AudioFileSchema,
  outputFormat: ExportFormatSchema,
  crossfade: z.boolean().default(false),
  crossfadeDuration: z.number().min(0).max(3).default(0),
});

export type MergerConfig = z.infer<typeof MergerSchema>;
