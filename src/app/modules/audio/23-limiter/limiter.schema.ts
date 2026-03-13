import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const LimiterSchema = z.object({
  inputFile: AudioFileSchema,
  outputFormat: ExportFormatSchema,
  ceiling: z.number().min(-6).max(0).default(-0.1),
  lookaheadMs: z.number().min(0).max(20).default(5),
});

export type LimiterConfig = z.infer<typeof LimiterSchema>;
