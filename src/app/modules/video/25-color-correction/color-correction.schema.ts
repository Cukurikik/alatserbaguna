import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const ColorCorrectionInputSchema = z.object({
  inputFile: VideoFileSchema,
  brightness: z.number().min(-1).max(1).default(0),
  contrast: z.number().min(-2).max(2).default(1),
  saturation: z.number().min(0).max(3).default(1),
  gamma: z.number().min(0.1).max(10).default(1)
});

export type ColorCorrectionConfig = z.infer<typeof ColorCorrectionInputSchema>;
