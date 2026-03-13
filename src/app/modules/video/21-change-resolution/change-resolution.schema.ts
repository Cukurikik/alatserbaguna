import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const ChangeResolutionInputSchema = z.object({
  inputFile: VideoFileSchema,
  width: z.number().min(1).max(7680), // Up to 8K
  height: z.number().min(1).max(4320),
  maintainAspectRatio: z.boolean().default(true)
});

export type ChangeResolutionConfig = z.infer<typeof ChangeResolutionInputSchema>;
