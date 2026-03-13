import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const ReverserInputSchema = z.object({
  inputFile: VideoFileSchema,
  reverseAudio: z.boolean(),
  /** Internal flag set by Effect if video > 120s — not validated as error */
  durationWarning: z.boolean().optional(),
});

export type ReverserInput = z.infer<typeof ReverserInputSchema>;
