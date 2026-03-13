import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const TransitionsInputSchema = z.object({
  clips: z.array(VideoFileSchema).min(2, 'At least 2 clips are required.'),
  transitions: z.array(
    z.object({
      type: z.string().min(1),
      duration: z.number().min(0.1).max(3.0),
    })
  ),
});

export type TransitionsInput = z.infer<typeof TransitionsInputSchema>;
