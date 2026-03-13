import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const RemoveWatermarkInputSchema = z.object({
  inputFile: VideoFileSchema,
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().min(1),
  height: z.number().min(1),
  blurStrength: z.number().min(1).max(50).default(10)
});

export type RemoveWatermarkConfig = z.infer<typeof RemoveWatermarkInputSchema>;
