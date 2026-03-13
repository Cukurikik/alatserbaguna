import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const VideoThumbnailInputSchema = z.object({
  inputFile: VideoFileSchema,
  timestamp: z.number().min(0).default(0),
  format: z.enum(['jpeg', 'png', 'webp']).default('jpeg'),
  quality: z.number().min(1).max(31).default(2) // qscale for jpeg/webp
});

export type VideoThumbnailConfig = z.infer<typeof VideoThumbnailInputSchema>;
