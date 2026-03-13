import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const EchoConfigSchema = z.object({
  file: AudioFileSchema,
  format: ExportFormatSchema,
  delayMs: z.number().min(50).max(3000).default(500),  // Delay time in ms
  feedback: z.number().min(0.1).max(0.99).default(0.5),  // Decay amount per repeat
  dryMix: z.number().min(0).max(1).default(0.8),       // In gain
  wetMix: z.number().min(0).max(1).default(0.6)        // Out gain
});

export type EchoConfig = z.infer<typeof EchoConfigSchema>;
