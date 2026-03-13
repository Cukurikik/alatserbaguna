import { z } from 'zod';

export const RecorderConfigSchema = z.object({
  audioSource: z.enum(['mic', 'system', 'both']),
  outputFormat: z.enum(['wav', 'mp3', 'aac', 'ogg', 'flac', 'opus', 'm4a']),
  sampleRate: z.union([z.literal(44100), z.literal(48000), z.literal(96000)]),
  bitDepth: z.union([z.literal(16), z.literal(24), z.literal(32)]),
  echoCancellation: z.boolean().default(true),
  noiseSuppression: z.boolean().default(true),
});

export type RecorderConfig = z.infer<typeof RecorderConfigSchema>;
