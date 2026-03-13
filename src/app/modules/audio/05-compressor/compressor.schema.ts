import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const CompressorSchema = z.object({
  inputFile: AudioFileSchema,
  outputFormat: ExportFormatSchema,
  threshold: z.number().min(-60).max(0).default(-24),
  ratio: z.number().min(1).max(20).default(4),
  attack: z.number().min(0.001).max(1).default(0.003),
  release: z.number().min(0.01).max(1).default(0.25),
  knee: z.number().min(0).max(40).default(30),
  makeupGain: z.number().min(-12).max(24).default(0),
});

export type CompressorConfig = z.infer<typeof CompressorSchema>;
