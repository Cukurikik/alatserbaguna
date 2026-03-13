import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const FlipRotateInputSchema = z.object({
  inputFile: VideoFileSchema,
  flipH: z.boolean(),
  flipV: z.boolean(),
  rotation: z.number().min(0).max(360)
}).refine(data => data.flipH || data.flipV || data.rotation !== 0, {
  message: 'At least one transformation must be applied'
});

export type FlipRotateConfig = z.infer<typeof FlipRotateInputSchema>;
