import { z } from 'zod';
import { VideoFileSchema, TimestampSchema } from '../shared/schemas/video.schemas';

export const ThumbnailInputSchema = z.object({
  inputFile: VideoFileSchema,
  mode: z.enum(['single', 'grid', 'interval']),
  timestamp: TimestampSchema.optional(),
  gridCols: z.number().int().min(1).max(10).optional(),
  gridRows: z.number().int().min(1).max(10).optional(),
  intervalSeconds: z.number().min(0.5).max(3600).optional(),
  imageFormat: z.enum(['jpg', 'png', 'webp']),
  jpgQuality: z.number().int().min(1).max(100),
});

export type ThumbnailInput = z.infer<typeof ThumbnailInputSchema>;
