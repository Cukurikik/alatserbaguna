import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const BlurInputSchema = z.object({
  inputFile: VideoFileSchema,
  mode: z.enum(['full', 'region', 'background']),
  strength: z.number().min(1).max(50),
  region: z.object({
    x: z.number().min(0),
    y: z.number().min(0),
    w: z.number().min(0),
    h: z.number().min(0),
  }).optional(),
});

export type BlurInput = z.infer<typeof BlurInputSchema>;
