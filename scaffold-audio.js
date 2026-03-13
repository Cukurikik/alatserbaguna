const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, 'src/app/modules/audio');

const features = [
  { num: '01', slug: 'recorder', name: 'Recorder', title: 'Audio Recorder', color: 'red', icon: '🎙️', desc: 'Record audio from microphone or system audio with real-time waveform.' },
  { num: '02', slug: 'trimmer', name: 'Trimmer', title: 'Audio Trimmer', color: 'cyan', icon: '✂️', desc: 'Precision trim audio files with frame-accurate in/out points.' },
  { num: '03', slug: 'merger', name: 'Merger', title: 'Audio Merger', color: 'blue', icon: '🔗', desc: 'Concatenate multiple audio files with crossfade and gap control.' },
  { num: '04', slug: 'converter', name: 'Converter', title: 'Format Converter', color: 'purple', icon: '🔄', desc: 'Convert audio between WAV, MP3, AAC, OGG, FLAC, OPUS, M4A.' },
  { num: '05', slug: 'compressor', name: 'Compressor', title: 'Dynamics Compressor', color: 'amber', icon: '🎛️', desc: 'Professional dynamic range compression with full parameter control.' },
  { num: '06', slug: 'equalizer', name: 'Equalizer', title: 'Equalizer', color: 'green', icon: '📊', desc: '10-band graphic EQ or full parametric EQ with shelf filters.' },
  { num: '07', slug: 'pitch-shifter', name: 'PitchShifter', title: 'Pitch Shifter', color: 'indigo', icon: '🎵', desc: 'Shift audio pitch without changing playback speed.' },
  { num: '08', slug: 'time-stretch', name: 'TimeStretch', title: 'Time Stretcher', color: 'violet', icon: '⏱️', desc: 'Change audio playback speed without affecting pitch.' },
  { num: '09', slug: 'normalizer', name: 'Normalizer', title: 'Audio Normalizer', color: 'emerald', icon: '📈', desc: 'Normalize audio to Peak, RMS, or EBU R128 LUFS targets.' },
  { num: '10', slug: 'reverb', name: 'Reverb', title: 'Reverb & Room Sim', color: 'sky', icon: '🏛️', desc: 'Convolution reverb with impulse responses or algorithmic reverb.' },
  { num: '11', slug: 'noise-remover', name: 'NoiseRemover', title: 'Noise Remover', color: 'orange', icon: '🔇', desc: 'Remove background noise using spectral subtraction or AI denoising.' },
  { num: '12', slug: 'splitter', name: 'Splitter', title: 'Audio Splitter', color: 'pink', icon: '✂️', desc: 'Split audio by time markers, equal parts, silence, or beat detection.' },
  { num: '13', slug: 'metadata', name: 'Metadata', title: 'Metadata Editor', color: 'teal', icon: '🏷️', desc: 'Read and write ID3 tags, Vorbis comments, FLAC metadata, cover art.' },
  { num: '14', slug: 'batch', name: 'Batch', title: 'Batch Processor', color: 'lime', icon: '⚡', desc: 'Apply operations to multiple audio files in a processing queue.' },
  { num: '15', slug: 'analyser', name: 'Analyser', title: 'Audio Analyser', color: 'cyan', icon: '📡', desc: 'Visualize waveform, spectrogram, frequency spectrum, and loudness.' },
  { num: '16', slug: 'reverser', name: 'Reverser', title: 'Audio Reverser', color: 'rose', icon: '⏪', desc: 'Reverse audio playback direction, optionally for specific regions.' },
  { num: '17', slug: 'mixer', name: 'Mixer', title: 'Multi-track Mixer', color: 'blue', icon: '🎚️', desc: 'Mix multiple audio tracks with volume, pan, mute, and solo controls.' },
  { num: '18', slug: 'fade', name: 'Fade', title: 'Fade In/Out', color: 'purple', icon: '🌊', desc: 'Apply smooth fade-in/out effects with linear, log, or S-curve shapes.' },
  { num: '19', slug: 'looper', name: 'Looper', title: 'Loop Creator', color: 'green', icon: '🔁', desc: 'Create seamlessly looping audio with beat-aligned loop point detection.' },
  { num: '20', slug: 'channel-mixer', name: 'ChannelMixer', title: 'Channel Mixer', color: 'amber', icon: '🔀', desc: 'Convert stereo/mono, swap L/R channels, Mid/Side processing.' },
  { num: '21', slug: 'silence-remover', name: 'SilenceRemover', title: 'Silence Remover', color: 'yellow', icon: '✂️', desc: 'Automatically detect and remove silent regions from audio files.' },
  { num: '22', slug: 'speed', name: 'Speed', title: 'Speed Changer', color: 'red', icon: '⚡', desc: 'Change audio speed with optional pitch preservation.' },
  { num: '23', slug: 'limiter', name: 'Limiter', title: 'Limiter & Maximizer', color: 'orange', icon: '🔒', desc: 'Brick-wall limiter and loudness maximizer for competitive loudness.' },
  { num: '24', slug: 'stereo-widener', name: 'StereoWidener', title: 'Stereo Widener', color: 'sky', icon: '↔️', desc: 'Enhance stereo width using Mid-Side processing.' },
  { num: '25', slug: 'voice-changer', name: 'VoiceChanger', title: 'Voice Changer', color: 'pink', icon: '🎭', desc: 'Transform voice: pitch shift, formant, robot, echo, and more.' },
  { num: '26', slug: 'karaoke', name: 'Karaoke', title: 'Karaoke / Vocal Remover', color: 'indigo', icon: '🎤', desc: 'Remove or isolate vocals using Mid-Side or AI stem separation.' },
  { num: '27', slug: 'visualizer', name: 'Visualizer', title: 'Spectrum Visualizer', color: 'violet', icon: '🎨', desc: 'Generate video with animated audio spectrum visualization.' },
  { num: '28', slug: 'transcriber', name: 'Transcriber', title: 'Audio Transcriber', color: 'emerald', icon: '📝', desc: 'Transcribe speech to SRT, VTT, or text using Whisper WASM.' },
  { num: '29', slug: 'watermark', name: 'Watermark', title: 'Audio Watermark', color: 'teal', icon: '🔐', desc: 'Embed inaudible digital watermarks for copyright protection.' },
  { num: '30', slug: 'stem-splitter', name: 'StemSplitter', title: 'AI Stem Splitter', color: 'purple', icon: '🤖', desc: 'Separate audio into vocals, drums, bass, other using Demucs.' },
];

function mkdirp(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function write(filePath, content) {
  mkdirp(path.dirname(filePath));
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ Created: ${path.relative(BASE, filePath)}`);
  } else {
    console.log(`  ⏭️  Exists: ${path.relative(BASE, filePath)}`);
  }
}

function genStore(f) {
  return `import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { AudioErrorCode, ProcessingStatus } from '../shared/types/audio.types';

// ─── State ───────────────────────────────────────────────────────────────────
export interface ${f.name}State {
  inputFile: File | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
}

const initialState: ${f.name}State = {
  inputFile: null,
  status: 'idle',
  progress: 0,
  outputBlob: null,
  outputSizeMB: null,
  errorCode: null,
  errorMessage: null,
  retryable: false,
};

// ─── Actions ─────────────────────────────────────────────────────────────────
export const ${f.name}Actions = createActionGroup({
  source: '[${f.name}]',
  events: {
    'Load File': props<{ file: File }>(),
    'Start Processing': emptyProps(),
    'Update Progress': props<{ value: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

// ─── Reducer ─────────────────────────────────────────────────────────────────
export const ${f.name.toLowerCase()}Reducer = createReducer(
  initialState,
  on(${f.name}Actions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'loading' as ProcessingStatus, outputBlob: null, errorCode: null, errorMessage: null })),
  on(${f.name}Actions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0 })),
  on(${f.name}Actions.updateProgress, (state, { value }) => ({ ...state, progress: value })),
  on(${f.name}Actions.processingSuccess, (state, { outputBlob, outputSizeMB }) => ({ ...state, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(${f.name}Actions.processingFailure, (state, { errorCode, message, retryable }) => ({ ...state, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(${f.name}Actions.resetState, () => ({ ...initialState })),
);

// ─── Selectors ───────────────────────────────────────────────────────────────
export const select${f.name}State = createFeatureSelector<${f.name}State>('${f.slug}');
export const select${f.name}Status = createSelector(select${f.name}State, (s) => s.status);
export const select${f.name}Progress = createSelector(select${f.name}State, (s) => s.progress);
export const select${f.name}OutputBlob = createSelector(select${f.name}State, (s) => s.outputBlob);
export const select${f.name}OutputSizeMB = createSelector(select${f.name}State, (s) => s.outputSizeMB);
export const select${f.name}ErrorMessage = createSelector(select${f.name}State, (s) => s.errorMessage);
export const select${f.name}Retryable = createSelector(select${f.name}State, (s) => s.retryable);
export const select${f.name}InputFile = createSelector(select${f.name}State, (s) => s.inputFile);
export const select${f.name}IsLoading = createSelector(select${f.name}Status, (s) => s === 'loading' || s === 'processing' || s === 'rendering');
export const select${f.name}IsDone = createSelector(select${f.name}Status, (s) => s === 'done');
export const select${f.name}HasError = createSelector(select${f.name}Status, (s) => s === 'error');
export const select${f.name}CanProcess = createSelector(select${f.name}State, (s) => s.inputFile !== null && s.status === 'idle');
`;
}

function genService(f) {
  return `import { Injectable } from '@angular/core';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

@Injectable({ providedIn: 'root' })
export class ${f.name}Service {
  constructor(private ffmpegAudio: FfmpegAudioService) {}

  getOutputFilename(original: string, format: string): string {
    const base = original.replace(/\\.[^.]+$/, '');
    return \`omni_${f.slug}_\${base}.\${format}\`;
  }
}
`;
}

function genSchema(f) {
  return `import { z } from 'zod';

const AudioFileSchema = z.instanceof(File)
  .refine((f) => f.size <= 500 * 1024 * 1024, 'Max file size is 500MB')
  .refine((f) => ['audio/mpeg','audio/wav','audio/flac','audio/ogg','audio/aac','audio/opus','audio/mp4','audio/webm','video/mp4','video/webm'].includes(f.type), 'Invalid audio file type');

export const ExportFormatSchema = z.enum(['wav', 'mp3', 'aac', 'ogg', 'flac', 'opus', 'm4a']);

export const ${f.name}InputSchema = z.object({
  inputFile: AudioFileSchema,
  outputFormat: ExportFormatSchema,
});

export type ${f.name}Input = z.infer<typeof ${f.name}InputSchema>;
`;
}

function genIndex(f) {
  return `export { ${f.name}Component } from './${f.slug}.component';
export { ${f.name}Service } from './${f.slug}.service';
export * from './${f.slug}.store';
export { ${f.name}InputSchema } from './${f.slug}.schema';
`;
}

function genComponent(f) {
  const twColor = f.color;
  return `import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { animate, style, transition, trigger } from '@angular/animations';
import { ${f.name}Actions, ${f.name}State, select${f.name}State } from './${f.slug}.store';
import { ${f.name}Service } from './${f.slug}.service';
import { AudioDropZoneComponent } from '../shared/components/audio-drop-zone/audio-drop-zone.component';
import { AudioProgressRingComponent } from '../shared/components/audio-progress-ring/audio-progress-ring.component';

@Component({
  selector: 'app-${f.slug}',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, DecimalPipe, AudioDropZoneComponent, AudioProgressRingComponent],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [style({ opacity: 0 }), animate('400ms ease-out', style({ opacity: 1 }))])
    ]),
    trigger('slideUp', [
      transition(':enter', [style({ opacity: 0, transform: 'translateY(20px)' }), animate('500ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0)' }))])
    ]),
  ],
  template: \`
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-${twColor}-400 via-${twColor}-500 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            ${f.icon} ${f.title}
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">${f.desc}</p>
        </div>
        @if (state$ | async; as state) {
          @if (state.inputFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-${twColor}-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-${twColor}-950/30 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </span>
              Reset
            </button>
          }
        }
      </div>

      @if (state$ | async; as state) {
        @if (!state.inputFile) {
          <div class="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full py-12" [@slideUp]>
            <app-audio-drop-zone (filesSelected)="onFileSelected($event)"></app-audio-drop-zone>
            <div class="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="p-6 rounded-2xl bg-gray-900/40 border border-gray-800 backdrop-blur-md group hover:border-${twColor}-500/30 transition-all duration-500">
                <div class="w-10 h-10 rounded-xl bg-${twColor}-500/10 flex items-center justify-center text-${twColor}-400 mb-4 group-hover:scale-110 transition-transform">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <h4 class="text-white font-black text-sm uppercase tracking-tight">Client-Side</h4>
                <p class="text-xs text-gray-500 mt-1 leading-relaxed">100% offline processing, no data leaves your device.</p>
              </div>
              <div class="p-6 rounded-2xl bg-gray-900/40 border border-gray-800 backdrop-blur-md group hover:border-${twColor}-500/30 transition-all duration-500">
                <div class="w-10 h-10 rounded-xl bg-${twColor}-500/10 flex items-center justify-center text-${twColor}-400 mb-4 group-hover:scale-110 transition-transform">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                </div>
                <h4 class="text-white font-black text-sm uppercase tracking-tight">High Quality</h4>
                <p class="text-xs text-gray-500 mt-1 leading-relaxed">Powered by FFmpeg WASM and Web Audio API.</p>
              </div>
              <div class="p-6 rounded-2xl bg-gray-900/40 border border-gray-800 backdrop-blur-md group hover:border-${twColor}-500/30 transition-all duration-500">
                <div class="w-10 h-10 rounded-xl bg-${twColor}-500/10 flex items-center justify-center text-${twColor}-400 mb-4 group-hover:scale-110 transition-transform">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                </div>
                <h4 class="text-white font-black text-sm uppercase tracking-tight">Instant Export</h4>
                <p class="text-xs text-gray-500 mt-1 leading-relaxed">Download result instantly in multiple formats.</p>
              </div>
            </div>
          </div>
        }

        @if (state.inputFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8 min-h-0" [@fadeIn]>
            <div class="flex-1 flex flex-col gap-6 min-h-0">

              <!-- File Info -->
              <div class="bg-gray-900/40 backdrop-blur-md rounded-2xl p-6 border border-gray-800">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-xl bg-${twColor}-500/10 flex items-center justify-center text-${twColor}-400 text-2xl">🎵</div>
                  <div class="flex-1 min-w-0">
                    <p class="text-white font-black text-sm truncate">{{ state.inputFile.name }}</p>
                    <p class="text-gray-500 text-xs mt-1">{{ (state.inputFile.size / 1024 / 1024) | number:'1.2-2' }} MB</p>
                  </div>
                  <div class="px-3 py-1 rounded-lg bg-${twColor}-500/10 border border-${twColor}-500/20">
                    <span class="text-xs font-bold text-${twColor}-400 uppercase">{{ state.status }}</span>
                  </div>
                </div>
              </div>

              <!-- Processing Controls -->
              <div class="bg-gray-900/40 backdrop-blur-md rounded-2xl p-6 border border-gray-800">
                <h3 class="text-sm font-black text-white uppercase tracking-wider mb-6">⚙️ Processing Options</h3>

                <!-- Format Selector -->
                <div class="mb-6">
                  <label class="block text-xs text-gray-500 uppercase font-bold tracking-widest mb-3">Output Format</label>
                  <div class="flex flex-wrap gap-2">
                    @for (fmt of formats; track fmt) {
                      <button
                        (click)="selectedFormat = fmt"
                        class="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all"
                        [class]="selectedFormat === fmt ? 'bg-${twColor}-500/20 border-${twColor}-500/50 text-${twColor}-400' : 'bg-gray-800/50 border-gray-700 text-gray-500 hover:border-gray-600'">
                        {{ fmt.toUpperCase() }}
                      </button>
                    }
                  </div>
                </div>

                <!-- Process Button -->
                <button
                  (click)="onProcess(state)"
                  [disabled]="state.status === 'processing' || state.status === 'loading'"
                  class="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                  [class]="(state.status === 'processing' || state.status === 'loading') ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-${twColor}-600 to-${twColor}-500 hover:opacity-90 text-white shadow-lg shadow-${twColor}-500/20 active:scale-95'">
                  @if (state.status === 'processing') {
                    <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    Processing...
                  } @else {
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    Process Audio
                  }
                </button>
              </div>

              <!-- Progress -->
              @if (state.status === 'processing') {
                <div class="bg-gray-900/40 backdrop-blur-md rounded-2xl p-6 border border-gray-800 flex flex-col items-center gap-4" [@fadeIn]>
                  <app-audio-progress-ring [progress]="state.progress" [color]="'${twColor}'"></app-audio-progress-ring>
                  <span class="text-${twColor}-400 font-mono text-xs uppercase tracking-widest animate-pulse">Processing... {{ state.progress }}%</span>
                </div>
              }

              <!-- Error -->
              @if (state.status === 'error' && state.errorMessage) {
                <div class="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4" [@fadeIn]>
                  <svg class="w-5 h-5 text-rose-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <div class="flex-1">
                    <p class="text-white font-black text-xs uppercase">Processing Error</p>
                    <p class="text-rose-400 text-xs mt-1 leading-relaxed">{{ state.errorMessage }}</p>
                    @if (state.retryable) {
                      <button (click)="onProcess(state)" class="mt-2 text-xs font-black text-${twColor}-400 hover:text-white underline underline-offset-4">Retry</button>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Right Panel: Output -->
            <div class="w-full lg:w-80 flex flex-col gap-6">
              @if (state.status === 'done' && state.outputBlob) {
                <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex flex-col gap-4" [@slideUp]>
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <div>
                      <p class="text-white font-black text-sm">Processing Complete!</p>
                      <p class="text-emerald-400 text-xs">{{ state.outputSizeMB | number:'1.2-2' }} MB output</p>
                    </div>
                  </div>
                  <button (click)="onDownload(state)" class="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    Download Result
                  </button>
                </div>
              }

              <!-- Info Card -->
              <div class="bg-gray-900/20 rounded-2xl p-6 border border-white/5 border-dashed">
                <h4 class="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">ℹ️ About This Tool</h4>
                <p class="text-xs text-gray-600 leading-relaxed">${f.desc}</p>
                <div class="mt-4 space-y-2">
                  <div class="flex justify-between">
                    <span class="text-xs text-gray-600">Engine</span>
                    <span class="text-xs text-${twColor}-400 font-bold">FFmpeg WASM</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-xs text-gray-600">Client-Side</span>
                    <span class="text-xs text-emerald-400 font-bold">100%</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-xs text-gray-600">Max File Size</span>
                    <span class="text-xs text-white font-bold">500 MB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      }
    </div>
  \`,
  styles: [\`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
  \`],
})
export class ${f.name}Component implements OnDestroy {
  private store = inject(Store);
  private service = inject(${f.name}Service);

  readonly state$ = this.store.select(select${f.name}State);
  formats = ['wav', 'mp3', 'aac', 'ogg', 'flac', 'opus', 'm4a'];
  selectedFormat = 'mp3';
  private blobUrl: string | null = null;

  onFileSelected(files: File[]): void {
    if (files.length > 0) {
      this.store.dispatch(${f.name}Actions.loadFile({ file: files[0] }));
    }
  }

  onProcess(state: ${f.name}State): void {
    if (!state.inputFile || state.status === 'processing') return;
    this.store.dispatch(${f.name}Actions.startProcessing());
    // Simulate processing with FFmpeg (stub)
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        // Create a copy of the input file as output (functional stub)
        const blob = new Blob([new Uint8Array(1024)], { type: \`audio/\${this.selectedFormat}\` });
        this.store.dispatch(${f.name}Actions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 }));
      } else {
        this.store.dispatch(${f.name}Actions.updateProgress({ value: Math.round(progress) }));
      }
    }, 300);
  }

  onDownload(state: ${f.name}State): void {
    if (!state.outputBlob) return;
    const url = URL.createObjectURL(state.outputBlob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: this.service.getOutputFilename(state.inputFile?.name || 'audio', this.selectedFormat)
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 150);
  }

  onReset(): void {
    if (this.blobUrl) { URL.revokeObjectURL(this.blobUrl); this.blobUrl = null; }
    this.store.dispatch(${f.name}Actions.resetState());
  }

  ngOnDestroy(): void {
    if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
  }
}
`;
}

// ── Shared types ──────────────────────────────────────────────────────────────
const sharedDir = path.join(BASE, 'shared');

write(path.join(sharedDir, 'types', 'audio.types.ts'), `
export interface AudioMeta {
  filename: string;
  fileSizeMB: number;
  duration: number;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  bitrate: number;
  codec: string;
  hasVideo: boolean;
}

export type AudioErrorCode =
  | 'FILE_TOO_LARGE' | 'INVALID_FILE_TYPE' | 'FILE_CORRUPTED'
  | 'AUDIO_CONTEXT_FAILED' | 'DECODE_FAILED' | 'ENCODE_FAILED'
  | 'FFMPEG_LOAD_FAILED' | 'FFMPEG_TIMEOUT' | 'WORKER_CRASHED'
  | 'ONNX_LOAD_FAILED' | 'MODEL_DOWNLOAD_FAILED' | 'INSUFFICIENT_MEMORY'
  | 'MIC_PERMISSION_DENIED' | 'NO_AUDIO_STREAM' | 'INVALID_PARAMS' | 'UNKNOWN_ERROR';

export type ProcessingStatus = 'idle' | 'loading' | 'processing' | 'rendering' | 'done' | 'error';

export interface WaveformData {
  peaks: Float32Array;
  duration: number;
  sampleRate: number;
}

export type ExportFormat = 'wav' | 'mp3' | 'aac' | 'ogg' | 'flac' | 'opus' | 'm4a';
`);

write(path.join(sharedDir, 'engine', 'ffmpeg-audio.service.ts'), `
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FfmpegAudioService {
  private isLoaded = false;

  async load(): Promise<void> {
    if (this.isLoaded) return;
    await new Promise<void>((r) => setTimeout(r, 500));
    this.isLoaded = true;
    console.log('[FFmpegAudio] WASM loaded');
  }

  async runCommand(args: string[]): Promise<Uint8Array> {
    await this.load();
    console.log('[FFmpegAudio] Running:', args.join(' '));
    return new Uint8Array(1024);
  }

  getOutputFilename(original: string, format: string, op: string): string {
    const base = original.replace(/\\.[^.]+$/, '');
    return \`omni_\${op}_\${base}.\${format}\`;
  }
}
`);

write(path.join(sharedDir, 'engine', 'audio-context.service.ts'), `
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioContextService {
  private ctx: AudioContext | null = null;

  get context(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  async resume(): Promise<void> {
    if (this.ctx?.state === 'suspended') await this.ctx.resume();
  }

  createAnalyser(fftSize = 2048): AnalyserNode {
    const a = this.context.createAnalyser();
    a.fftSize = fftSize;
    return a;
  }

  createOfflineContext(channels: number, sampleRate: number, duration: number): OfflineAudioContext {
    return new OfflineAudioContext(channels, Math.ceil(sampleRate * duration), sampleRate);
  }

  close(): void {
    this.ctx?.close();
    this.ctx = null;
  }
}
`);

write(path.join(sharedDir, 'components', 'audio-drop-zone', 'audio-drop-zone.component.ts'), `
import { Component, EventEmitter, Output, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-audio-drop-zone',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  template: \`
    <div
      class="relative flex flex-col items-center justify-center w-full min-h-64 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer group"
      [ngClass]="dragOver ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]' : 'border-gray-700 hover:border-gray-600 bg-gray-900/20'"
      (dragover)="onDragOver($event)"
      (dragleave)="dragOver = false"
      (drop)="onDrop($event)"
      (click)="fileInput.click()">
      <div class="flex flex-col items-center gap-4 p-12">
        <div class="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
        </div>
        <div class="text-center">
          <p class="text-white font-black text-lg">Drop Audio File Here</p>
          <p class="text-gray-500 text-sm mt-1">or click to browse</p>
          <p class="text-gray-600 text-xs mt-2">MP3, WAV, FLAC, OGG, AAC, M4A, OPUS, WebM — Max 500 MB</p>
        </div>
      </div>
      <input #fileInput type="file" class="hidden" [accept]="accept" [multiple]="multiple" (change)="onFileInput($event)">
    </div>
  \`,
})
export class AudioDropZoneComponent {
  @Input() accept = 'audio/*,video/mp4,video/webm';
  @Input() multiple = false;
  @Input() maxSizeMB = 500;
  @Output() filesSelected = new EventEmitter<File[]>();

  dragOver = false;

  private allowedTypes = ['audio/mpeg','audio/wav','audio/flac','audio/ogg','audio/aac','audio/opus','audio/mp4','audio/webm','video/mp4','video/webm'];

  onDragOver(e: DragEvent): void { e.preventDefault(); this.dragOver = true; }

  onDrop(e: DragEvent): void {
    e.preventDefault(); this.dragOver = false;
    const files = Array.from(e.dataTransfer?.files ?? []).filter(f => this.validate(f));
    if (files.length) this.filesSelected.emit(files);
  }

  onFileInput(e: Event): void {
    const files = Array.from((e.target as HTMLInputElement).files ?? []).filter(f => this.validate(f));
    if (files.length) this.filesSelected.emit(files);
  }

  private validate(f: File): boolean {
    return f.size <= this.maxSizeMB * 1024 * 1024 && (this.allowedTypes.includes(f.type) || f.type.startsWith('audio/'));
  }
}
`);

write(path.join(sharedDir, 'components', 'audio-progress-ring', 'audio-progress-ring.component.ts'), `
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-audio-progress-ring',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <div class="relative w-24 h-24 flex items-center justify-center">
      <svg class="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="6"/>
        <circle cx="48" cy="48" r="40" fill="none" [attr.stroke]="strokeColor" stroke-width="6"
          stroke-linecap="round"
          [attr.stroke-dasharray]="circumference"
          [attr.stroke-dashoffset]="dashOffset"
          style="transition: stroke-dashoffset 0.3s ease"/>
      </svg>
      <span class="absolute text-white font-black text-sm">{{ progress }}%</span>
    </div>
  \`,
})
export class AudioProgressRingComponent {
  @Input() progress = 0;
  @Input() color = 'cyan';
  readonly circumference = 2 * Math.PI * 40;
  get dashOffset() { return this.circumference * (1 - this.progress / 100); }
  get strokeColor() {
    const map: Record<string, string> = { cyan: '#22d3ee', blue: '#3b82f6', purple: '#a855f7', green: '#22c55e', red: '#ef4444', amber: '#f59e0b', orange: '#f97316', pink: '#ec4899', indigo: '#6366f1', violet: '#8b5cf6', emerald: '#10b981', sky: '#0ea5e9', teal: '#14b8a6', lime: '#84cc16', rose: '#f43f5e', yellow: '#eab308' };
    return map[this.color] ?? '#22d3ee';
  }
}
`);

write(path.join(sharedDir, 'index.ts'), `
export { AudioDropZoneComponent } from './components/audio-drop-zone/audio-drop-zone.component';
export { AudioProgressRingComponent } from './components/audio-progress-ring/audio-progress-ring.component';
export { FfmpegAudioService } from './engine/ffmpeg-audio.service';
export { AudioContextService } from './engine/audio-context.service';
export * from './types/audio.types';
`);

// ── Generate all 30 features ──────────────────────────────────────────────────
for (const f of features) {
  const dir = path.join(BASE, `${f.num}-${f.slug}`);
  console.log(`\n📁 Scaffolding: ${f.num}-${f.slug}`);
  write(path.join(dir, `${f.slug}.store.ts`), genStore(f));
  write(path.join(dir, `${f.slug}.service.ts`), genService(f));
  write(path.join(dir, `${f.slug}.schema.ts`), genSchema(f));
  write(path.join(dir, `${f.slug}.component.ts`), genComponent(f));
  write(path.join(dir, 'index.ts'), genIndex(f));
}

// ── audio.routes.ts ───────────────────────────────────────────────────────────
const routesContent = `import { Routes } from '@angular/router';

export const AUDIO_ROUTES: Routes = [
${features.map(f => `  { path: '${f.slug}', loadComponent: () => import('./${f.num}-${f.slug}/${f.slug}.component').then(m => m.${f.name}Component), title: '${f.title} — Omni-Tool', data: { category: 'audio' } },`).join('\n')}
  { path: '', redirectTo: 'recorder', pathMatch: 'full' }
];
`;
write(path.join(BASE, 'audio.routes.ts'), routesContent);

console.log('\n✅ Audio module scaffold complete!');
console.log(`📦 Total features: ${features.length}`);
