import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const AudioExtractorInputSchema = z.object({
  inputFile: VideoFileSchema,
  outputFormat: z.enum(['wav', 'mp3', 'aac', 'ogg', 'flac']),
  bitrate: z.union([
    z.literal(128),
    z.literal(192),
    z.literal(256),
    z.literal(320),
  ]),
});

export type AudioExtractorInput = z.infer<typeof AudioExtractorInputSchema>;
