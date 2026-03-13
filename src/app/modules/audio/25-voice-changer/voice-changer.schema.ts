import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const VoiceChangerSchema = z.object({
  inputFile: AudioFileSchema,
  outputFormat: ExportFormatSchema,
  pitch: z.number().min(-12).max(12).default(0),
  speed: z.number().min(0.5).max(2.0).default(1.0),
});

export type VoiceChangerConfig = z.infer<typeof VoiceChangerSchema>;
