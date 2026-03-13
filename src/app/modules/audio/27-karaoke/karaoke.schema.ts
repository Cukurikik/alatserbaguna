import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const KaraokeMethodSchema = z.enum(['midSide', 'ai']);
export const KaraokeOutputSchema = z.enum(['karaoke', 'vocals']);

export const KaraokeConfigSchema = z.object({
  file: AudioFileSchema,
  format: ExportFormatSchema,
  method: KaraokeMethodSchema,
  outputTarget: KaraokeOutputSchema,
  strength: z.number().min(0).max(1).default(1.0),
});

export type KaraokeMethod = z.infer<typeof KaraokeMethodSchema>;
export type KaraokeOutput = z.infer<typeof KaraokeOutputSchema>;
export type KaraokeConfig = z.infer<typeof KaraokeConfigSchema>;
