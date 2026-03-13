import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const LooperInputSchema = z.object({
  inputFile: VideoFileSchema,
  mode: z.enum(['count', 'duration']),
  loopCount: z.number().int().min(1).max(100).optional(),
  targetDuration: z.number().min(1).max(86400).optional(),
  crossfade: z.boolean(),
  crossfadeDuration: z.number().min(0).max(1)
}).refine(data => {
  if (data.mode === 'count') return data.loopCount !== undefined;
  if (data.mode === 'duration') return data.targetDuration !== undefined;
  return false;
}, { message: 'Invalid configuration for selected mode' });

export type LooperConfig = z.infer<typeof LooperInputSchema>;
