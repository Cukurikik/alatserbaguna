import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const ChannelOperationSchema = z.enum(['toMono', 'toStereo', 'swapLR', 'extractL', 'extractR', 'midSideEncode']);

export const ChannelMixerConfigSchema = z.object({
  file: AudioFileSchema,
  format: ExportFormatSchema,
  operation: ChannelOperationSchema,
  monoMode: z.enum(['average', 'left', 'right']).default('average'),
});

export type ChannelOperation = z.infer<typeof ChannelOperationSchema>;
export type ChannelMixerConfig = z.infer<typeof ChannelMixerConfigSchema>;
