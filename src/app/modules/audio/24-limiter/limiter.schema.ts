import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const LimiterSchema = z.object({
  file: AudioFileSchema,
  format: ExportFormatSchema,
  ceiling: z.number().min(-6).max(0).default(-1),
  lookaheadMs: z.number().min(0).max(20).default(5),
  release: z.number().min(0.01).max(1.0).default(0.1),
  targetLUFS: z.number().min(-23).max(-6).nullable().default(-14),
  truePeak: z.boolean().default(false),
});

export type LimiterConfig = z.infer<typeof LimiterSchema>;
