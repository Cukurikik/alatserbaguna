import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const ToGifInputSchema = z.object({
  inputFile: VideoFileSchema,
  fps: z.number().int().min(1).max(60).default(15),
  scale: z.number().int().min(16).max(1920).default(480),
  startTime: z.number().min(0).optional(),
  duration: z.number().min(0.1).max(60).optional(),
  quality: z.enum(['low', 'medium', 'high']).default('medium'),
  dither: z.enum(['none', 'bayer', 'floyd_steinberg', 'sierra2_4a']).default('bayer')
});

export type ToGifConfig = z.infer<typeof ToGifInputSchema>;
