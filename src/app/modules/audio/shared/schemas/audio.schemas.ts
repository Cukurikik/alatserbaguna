import { z } from 'zod';

export const AudioFileSchema = z.instanceof(File).refine(
  (f) => f.size <= 500 * 1024 * 1024,
  { message: 'File must be under 500 MB' }
).refine(
  (f) => /\.(mp3|wav|flac|ogg|m4a|opus|aac|webm|mp4|mov|avi)$/i.test(f.name),
  { message: 'Unsupported file type' }
);

export const ExportFormatSchema = z.enum(['wav', 'mp3', 'aac', 'ogg', 'flac', 'opus', 'm4a']);
