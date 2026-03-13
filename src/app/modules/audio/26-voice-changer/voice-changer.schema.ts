import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const VoicePresetSchema = z.enum(['original', 'male-to-female', 'female-to-male', 'chipmunk', 'giant', 'robot', 'echo']);

export const VoiceChangerConfigSchema = z.object({
  file: AudioFileSchema,
  format: ExportFormatSchema,
  preset: VoicePresetSchema,
  pitchSemitones: z.number().min(-12).max(12).default(0),
  speed: z.number().min(0.5).max(2.0).default(1.0),
  robotFrequency: z.number().min(80).max(400).default(100),
  echoDelay: z.number().min(50).max(2000).default(400),
  echoDecay: z.number().min(0.1).max(0.9).default(0.5),
});

export type VoicePreset = z.infer<typeof VoicePresetSchema>;
export type VoiceChangerConfig = z.infer<typeof VoiceChangerConfigSchema>;
