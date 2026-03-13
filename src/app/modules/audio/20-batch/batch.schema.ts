import { z } from 'zod';
import { ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const BatchOperationSchema = z.enum(['convert', 'normalize', 'compress', 'trim-silence']);

export const BatchConfigSchema = z.object({
  operation: BatchOperationSchema,
  format: ExportFormatSchema,
});

export type BatchOperation = z.infer<typeof BatchOperationSchema>;
export type BatchConfig = z.infer<typeof BatchConfigSchema>;

export interface BatchFileState {
  id: string;
  file: File;
  status: 'queued' | 'processing' | 'done' | 'error';
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  error: string | null;
}
