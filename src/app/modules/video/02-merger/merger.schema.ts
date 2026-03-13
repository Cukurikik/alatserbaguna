import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const MergerInputSchema = z.object({
  clips: z
    .array(VideoFileSchema)
    .min(2, 'At least 2 clips required.')
    .max(50, 'Maximum 50 clips allowed.'),
  outputFormat: z.enum(['mp4', 'webm']),
  encodeMode: z.enum(['copy', 'reencode']),
});

export type MergerInput = z.infer<typeof MergerInputSchema>;
