import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const MergerConfigSchema = z.object({
  files: z.array(AudioFileSchema).min(2, "At least 2 files are required to merge"),
  format: ExportFormatSchema,
  crossfadeDurationMs: z.number().min(0).max(10000).default(0), // 0 means append directly
  gapDurationMs: z.number().min(0).max(10000).default(0),      // silence between tracks
});

export type MergerConfig = z.infer<typeof MergerConfigSchema>;
