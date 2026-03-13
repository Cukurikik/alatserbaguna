import { z } from 'zod';
import { VideoFileSchema, TimestampSchema } from '../shared/schemas/video.schemas';

export const PipInputSchema = z.object({
  mainFile: VideoFileSchema,
  overlayFile: VideoFileSchema,
  pipWidth: z.number().min(5).max(80),   // % of main video width
  position: z.enum(['TL', 'TR', 'BL', 'BR']),
  startTime: TimestampSchema.nullable(),
  endTime: TimestampSchema.nullable(),
  borderRadius: z.number().min(0).max(50),
});

export type PipInput = z.infer<typeof PipInputSchema>;
