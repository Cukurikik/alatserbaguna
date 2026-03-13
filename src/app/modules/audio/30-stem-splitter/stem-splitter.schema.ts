import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const StemLabelSchema = z.enum(['vocals', 'drums', 'bass', 'other']);

export const StemSplitterConfigSchema = z.object({
  file: AudioFileSchema,
  format: ExportFormatSchema,
  selectedStems: z.array(StemLabelSchema).default(['vocals', 'drums', 'bass', 'other']),
});

export type StemLabel = z.infer<typeof StemLabelSchema>;
export type StemSplitterConfig = z.infer<typeof StemSplitterConfigSchema>;

export interface StemOutput {
  label: StemLabel;
  blob: Blob | null;
  sizeMB: number | null;
  isReady: boolean;
}
