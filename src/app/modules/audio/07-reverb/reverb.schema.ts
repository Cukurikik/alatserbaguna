import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const ReverbConfigSchema = z.object({
  file: AudioFileSchema,
  format: ExportFormatSchema,
  roomSizeMs: z.number().min(10).max(200).default(60), // Delay
  damping: z.number().min(0.1).max(0.99).default(0.5),   // Decay
  dryMix: z.number().min(0).max(1).default(0.8),       // In gain
  wetMix: z.number().min(0).max(1).default(0.3)        // Out gain
});

export type ReverbConfig = z.infer<typeof ReverbConfigSchema>;
