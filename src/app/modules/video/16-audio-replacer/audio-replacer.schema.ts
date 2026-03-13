import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const AudioReplacerInputSchema = z.object({
  videoFile: VideoFileSchema,
  audioFile: z.instanceof(File),
  mode: z.enum(['replace', 'mix']),
  originalVolume: z.number().min(0).max(2),
  newAudioVolume: z.number().min(0).max(2),
  loopAudio: z.boolean(),
});

export type AudioReplacerInput = z.infer<typeof AudioReplacerInputSchema>;
