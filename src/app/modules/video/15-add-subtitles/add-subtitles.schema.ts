import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const AddSubtitlesInputSchema = z.object({
  inputFile: VideoFileSchema,
  subtitleFile: z.instanceof(File, { message: 'Subtitle file is required' }),
  mode: z.enum(['hard', 'soft']).default('hard'),
  language: z.string().default('eng')
});

export type AddSubtitlesConfig = z.infer<typeof AddSubtitlesInputSchema>;
