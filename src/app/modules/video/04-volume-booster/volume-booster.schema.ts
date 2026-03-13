import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const VolumeBoosterInputSchema = z.object({
  inputFile: VideoFileSchema,
  volumeMultiplier: z.number().min(0).max(10).default(2)
});

export type VolumeBoosterConfig = z.infer<typeof VolumeBoosterInputSchema>;
