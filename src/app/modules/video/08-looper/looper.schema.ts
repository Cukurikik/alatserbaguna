import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const LooperInputSchema = z.object({
  inputFile: VideoFileSchema,
  mode: z.enum(['count', 'duration']),
  loopCount: z.number().int().min(1).max(100).optional(),
  targetDuration: z.number().min(1).max(86_400).optional(), // max 24 hours
  crossfade: z.boolean(),
  crossfadeDuration: z.number().min(0).max(1),
});

export type LooperInput = z.infer<typeof LooperInputSchema>;
