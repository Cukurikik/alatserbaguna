import { z } from 'zod';

const AudioFileSchema = z.instanceof(File)
  .refine((f) => f.size <= 500 * 1024 * 1024, 'Max file size is 500MB')
  .refine((f) => ['audio/mpeg','audio/wav','audio/flac','audio/ogg','audio/aac','audio/opus','audio/mp4','audio/webm','video/mp4','video/webm'].includes(f.type), 'Invalid audio file type');

export const ExportFormatSchema = z.enum(['wav', 'mp3', 'aac', 'ogg', 'flac', 'opus', 'm4a']);

export const ChannelMixerInputSchema = z.object({
  inputFile: AudioFileSchema,
  outputFormat: ExportFormatSchema,
});

export type ChannelMixerInput = z.infer<typeof ChannelMixerInputSchema>;
