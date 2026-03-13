import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const ConverterSchema = z.object({
  inputFile: AudioFileSchema,
  outputFormat: ExportFormatSchema,
  bitrate: z.union([z.literal(64), z.literal(128), z.literal(192), z.literal(256), z.literal(320)]).default(192),
  sampleRate: z.union([z.literal(22050), z.literal(44100), z.literal(48000), z.literal(96000)]).default(44100),
});

export type ConverterConfig = z.infer<typeof ConverterSchema>;
