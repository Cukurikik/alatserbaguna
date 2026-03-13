import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const PitchConfigSchema = z.object({
  file: AudioFileSchema,
  format: ExportFormatSchema,
  semitones: z.number().min(-12).max(12).default(0), // -12 to +12 semitones
  preserveTempo: z.boolean().default(true) // If false, acts like a vinyl speed control
});

export type PitchConfig = z.infer<typeof PitchConfigSchema>;
