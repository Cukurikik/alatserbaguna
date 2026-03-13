import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const InterpolatorInputSchema = z.object({
  inputFile: VideoFileSchema,
  targetFPS: z.enum(['24', '30', '60', '120']),
  algorithm: z.enum(['duplicate', 'motion']),
});

export type InterpolatorInput = z.infer<typeof InterpolatorInputSchema>;
