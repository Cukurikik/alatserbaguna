import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const ConverterConfigSchema = z.object({
  file: AudioFileSchema,
  format: ExportFormatSchema,
  bitrate: z.enum(['64k', '128k', '192k', '256k', '320k']).default('192k'),
  sampleRate: z.union([z.literal(44100), z.literal(48000), z.literal(96000)]).default(44100),
  channels: z.union([z.literal(1), z.literal(2)]).default(2) // 1=Mono, 2=Stereo
});

export type ConverterConfig = z.infer<typeof ConverterConfigSchema>;
