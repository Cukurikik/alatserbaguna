import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const PitchShifterSchema = z.object({
  inputFile: AudioFileSchema,
  outputFormat: ExportFormatSchema,
  semitones: z.number().min(-12).max(12).default(0),
  cents: z.number().min(-100).max(100).default(0),
  formantCorrection: z.boolean().default(false),
});

export type PitchShifterConfig = z.infer<typeof PitchShifterSchema>;
