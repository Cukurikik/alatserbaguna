import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const SpeedInputSchema = z.object({
  inputFile: VideoFileSchema,
  speed: z.number().min(0.25).max(4.0),
  audioMode: z.enum(['keep', 'mute', 'pitchCorrect'])
});

export type SpeedConfig = z.infer<typeof SpeedInputSchema>;
