import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const AddAudioInputSchema = z.object({
  inputFile: VideoFileSchema,
  audioFile: z.instanceof(File, { message: 'Audio file is required' }),
  mode: z.enum(['replace', 'mix']).default('replace'),
  videoVolume: z.number().min(0).max(2).default(1),
  audioVolume: z.number().min(0).max(2).default(1),
  loopAudio: z.boolean().default(false)
});

export type AddAudioConfig = z.infer<typeof AddAudioInputSchema>;
