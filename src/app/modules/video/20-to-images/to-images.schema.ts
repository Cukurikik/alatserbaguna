import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const ToImagesInputSchema = z.object({
  inputFile: VideoFileSchema,
  fps: z.number().min(0.1).max(60).default(1), // Frames per second to extract
  format: z.enum(['jpg', 'png']).default('jpg'),
  quality: z.number().min(1).max(31).default(2) // For jpg, lower is better. 2 is high quality.
});

export type ToImagesConfig = z.infer<typeof ToImagesInputSchema>;
