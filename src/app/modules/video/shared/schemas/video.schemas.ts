// ─────────────────────────────────────────────────────────────────────────────
// video.schemas.ts — Shared base Zod schemas for all 30 video tools
// ─────────────────────────────────────────────────────────────────────────────
import { z } from 'zod';

/** Max supported file size: 2 GB */
const MAX_FILE_SIZE_BYTES = 2_147_483_648;

const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/',
];

// C0. Shared base schemas

/** Validates a browser File object that is a supported video type < 2 GB */
export const VideoFileSchema = z
  .instanceof(File)
  .refine(f => f.name.length > 0, { message: 'Filename must not be empty.' })
  .refine(f => f.size <= MAX_FILE_SIZE_BYTES, { message: 'File must be under 2 GB.' })
  .refine(
    f => VIDEO_MIME_TYPES.some(mime => f.type.startsWith(mime)),
    { message: 'Please upload a valid video file (MP4, WebM, MOV, AVI, MKV).' }
  );

/** Validates a time value in seconds (>= 0, finite) */
export const TimestampSchema = z
  .number()
  .min(0, 'Time cannot be negative.')
  .finite('Time must be a finite number.');

/** Validates a progress value 0–100 */
export const ProgressSchema = z.number().min(0).max(100);

/** Validates a video export format */
export const ExportFormatSchema = z.enum(['mp4', 'webm', 'mov', 'avi', 'mkv', 'gif']);
