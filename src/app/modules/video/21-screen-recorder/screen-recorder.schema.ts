import { z } from 'zod';

export const ScreenRecorderInputSchema = z.object({
  audioSource: z.enum(['mic', 'system', 'both', 'none']),
  resolution: z.enum(['1080p', '720p', '480p']),
  outputFormat: z.enum(['mp4', 'webm']),
});

export type ScreenRecorderInput = z.infer<typeof ScreenRecorderInputSchema>;
