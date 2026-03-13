import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const AddWatermarkInputSchema = z.object({
  inputFile: VideoFileSchema,
  watermarkFile: z.instanceof(File, { message: 'Watermark file is required' }),
  position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center']),
  opacity: z.number().min(0).max(100).default(100),
  scale: z.number().min(1).max(100).default(20), // Percentage of video width
  padding: z.number().min(0).max(100).default(10) // Pixels
});

export type AddWatermarkConfig = z.infer<typeof AddWatermarkInputSchema>;
