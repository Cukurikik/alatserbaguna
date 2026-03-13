import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const VideoToHlsInputSchema = z.object({
  inputFile: VideoFileSchema,
  segmentDuration: z.number().min(2).max(20).default(10),
  preset: z.enum(['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow']).default('fast')
});

export type VideoToHlsConfig = z.infer<typeof VideoToHlsInputSchema>;
