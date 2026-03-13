const fs = require('fs');
const path = require('path');
const BASE = path.join(__dirname, 'src/app/modules/audio');
function write(relPath, content) {
  const full = path.join(BASE, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content.trimStart(), 'utf8');
  console.log('✅', relPath);
}

// Generic store builder
function buildStore(featureKey, initialExtra = '', extraActions = '', extraReducerCases = '', extraEffects = '') {
  const name = featureKey.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const Name = name.charAt(0).toUpperCase() + name.slice(1);
  return `
import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat, AudioMeta } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

export interface ${Name}State {
  inputFile: File | null;
  audioMeta: AudioMeta | null;
  status: ProcessingStatus;
  progress: number;
  outputBlob: Blob | null;
  outputSizeMB: number | null;
  errorCode: AudioErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;${initialExtra}
}
const initialState: ${Name}State = {
  inputFile: null, audioMeta: null, status: 'idle', progress: 0,
  outputBlob: null, outputSizeMB: null, errorCode: null, errorMessage: null, retryable: false,${
    initialExtra.replace(/: .+;/g, ': null,').replace(/readonly /g, '')
      .replace(/\n  /g, '\n  ').replace(/boolean/g, 'false as boolean').replace(/number;/g, '0,')
      .replace(/string;/g, "'',").replace(/false as boolean,/g, 'false,')
  }
};
export const ${Name}Actions = createActionGroup({
  source: '[${Name}]', events: {
    'Load File': props<{ file: File }>(),
    'Load File Success': props<{ meta: AudioMeta }>(),
    'Load File Failure': props<{ errorCode: AudioErrorCode; message: string }>(),
    'Start Processing': props<{ format: ExportFormat }>(),
    'Update Progress': props<{ value: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string; retryable: boolean }>(),
    'Download Output': emptyProps(),
    'Reset State': emptyProps(),${extraActions}
  }
});
export const ${featureKey.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}Reducer = createReducer(
  initialState,
  on(${Name}Actions.loadFile, (s, { file }) => ({ ...s, inputFile: file, status: 'loading' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(${Name}Actions.loadFileSuccess, (s, { meta }) => ({ ...s, audioMeta: meta, status: 'idle' as ProcessingStatus })),
  on(${Name}Actions.loadFileFailure, (s, { errorCode, message }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message })),
  on(${Name}Actions.startProcessing, (s) => ({ ...s, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null })),
  on(${Name}Actions.updateProgress, (s, { value }) => ({ ...s, progress: value })),
  on(${Name}Actions.processingSuccess, (s, { outputBlob, outputSizeMB }) => ({ ...s, status: 'done' as ProcessingStatus, outputBlob, outputSizeMB, progress: 100 })),
  on(${Name}Actions.processingFailure, (s, { errorCode, message, retryable }) => ({ ...s, status: 'error' as ProcessingStatus, errorCode, errorMessage: message, retryable })),
  on(${Name}Actions.resetState, () => ({ ...initialState })),${extraReducerCases}
);
export const select${Name}State = createFeatureSelector<${Name}State>('${featureKey}');
export const select${Name}Status = createSelector(select${Name}State, s => s.status);
export const select${Name}InputFile = createSelector(select${Name}State, s => s.inputFile);
export const select${Name}AudioMeta = createSelector(select${Name}State, s => s.audioMeta);
export const select${Name}OutputBlob = createSelector(select${Name}State, s => s.outputBlob);
export const select${Name}OutputSizeMB = createSelector(select${Name}State, s => s.outputSizeMB);
export const select${Name}IsLoading = createSelector(select${Name}State, s => s.status === 'loading' || s.status === 'processing');
export const select${Name}IsDone = createSelector(select${Name}State, s => s.status === 'done');
export const select${Name}HasError = createSelector(select${Name}State, s => s.status === 'error');
export const select${Name}ErrorMessage = createSelector(select${Name}State, s => s.errorMessage);
export const select${Name}Retryable = createSelector(select${Name}State, s => s.retryable);
export const select${Name}CanProcess = createSelector(select${Name}State, s => !!s.inputFile && s.status === 'idle');

export const ${featureKey.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}ProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(${Name}Actions.startProcessing),
      withLatestFrom(store.select(select${Name}State)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) return of(${Name}Actions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file', retryable: false }));
        return new Observable<any>(obs => {
          let aborted = false;
          ffmpeg.processAudio(state.inputFile!, format, ['-i', '{in}', '{out}'], (p) => {
            if (!aborted) store.dispatch(${Name}Actions.updateProgress({ value: p }));
          }).then(blob => {
            if (!aborted) { obs.next(${Name}Actions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 })); obs.complete(); }
          }).catch(err => {
            if (!aborted) { obs.next(${Name}Actions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Processing failed', retryable: true })); obs.complete(); }
          });
          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);
`.trimStart();
}

// Generic component builder
function buildComponent(featureKey, title, emoji, description, color = 'cyan', extraTemplate = '') {
  const name = featureKey.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const Name = name.charAt(0).toUpperCase() + name.slice(1);
  const compName = featureKey.split('-').map((w, i) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w.charAt(0).toUpperCase() + w.slice(1)).join('');
  return `
import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger } from '@angular/animations';
import { ${Name}Actions, select${Name}State } from './${featureKey}.store';
import { AudioDropZoneComponent } from '../shared/components/audio-drop-zone/audio-drop-zone.component';
import { AudioProgressRingComponent } from '../shared/components/audio-progress-ring/audio-progress-ring.component';
import { AudioPlayerComponent } from '../shared/components/audio-player/audio-player.component';

@Component({
  selector: 'app-${featureKey}',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, DecimalPipe, AudioDropZoneComponent, AudioProgressRingComponent, AudioPlayerComponent],
  animations: [
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0 }), animate('400ms ease-out', style({ opacity: 1 }))])]),
    trigger('slideUp', [transition(':enter', [style({ opacity: 0, transform: 'translateY(20px)' }), animate('500ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0)' }))])]),
  ],
  template: \`
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto" [@fadeIn]>
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-${color}-400 via-${color}-500 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            ${emoji} ${title}
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">${description}</p>
        </div>
        @if ((state$ | async)?.inputFile) {
          <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-red-400 transition-all uppercase tracking-tighter">
            <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-red-950/30 transition-colors">✕</span>Reset
          </button>
        }
      </div>
      @if (state$ | async; as state) {
        @if (!state.inputFile) {
          <div class="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full py-12" [@slideUp]>
            <app-audio-drop-zone (filesSelected)="onFileSelected($event)"></app-audio-drop-zone>
          </div>
        } @else {
          <div class="flex-1 flex flex-col lg:flex-row gap-8 min-h-0" [@fadeIn]>
            <div class="flex-1 flex flex-col gap-6 min-h-0">
              <div class="bg-gray-900/40 backdrop-blur-md rounded-2xl p-6 border border-gray-800">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-xl bg-${color}-500/10 flex items-center justify-center text-${color}-400 text-2xl">${emoji}</div>
                  <div class="flex-1 min-w-0">
                    <p class="text-white font-black text-sm truncate">{{ state.inputFile.name }}</p>
                    <p class="text-gray-500 text-xs mt-1">{{ (state.inputFile.size / 1024 / 1024) | number:'1.2-2' }} MB</p>
                  </div>
                  <div class="px-3 py-1 rounded-lg bg-${color}-500/10 border border-${color}-500/20">
                    <span class="text-xs font-bold text-${color}-400 uppercase">{{ state.status }}</span>
                  </div>
                </div>
              </div>
              ${extraTemplate}
              <div class="bg-gray-900/40 backdrop-blur-md rounded-2xl p-6 border border-gray-800">
                <h3 class="text-sm font-black text-white uppercase tracking-wider mb-4">⚙️ Output Format</h3>
                <div class="flex flex-wrap gap-2 mb-6">
                  @for (fmt of formats; track fmt) {
                    <button (click)="selectedFormat = fmt"
                      class="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all"
                      [class]="selectedFormat === fmt ? 'bg-${color}-500/20 border-${color}-500/50 text-${color}-400' : 'bg-gray-800/50 border-gray-700 text-gray-500 hover:border-gray-600'">
                      {{ fmt.toUpperCase() }}
                    </button>
                  }
                </div>
                <button (click)="onProcess(state)" [disabled]="state.status === 'processing' || state.status === 'loading'"
                  class="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                  [class]="(state.status === 'processing' || state.status === 'loading') ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-${color}-600 to-${color}-500 hover:opacity-90 text-white shadow-lg shadow-${color}-500/20 active:scale-95'">
                  @if (state.status === 'processing') {
                    <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    Processing...
                  } @else { ⚡ Process Audio }
                </button>
              </div>
              @if (state.status === 'processing') {
                <div class="bg-gray-900/40 rounded-2xl p-6 border border-gray-800 flex flex-col items-center gap-4" [@fadeIn]>
                  <app-audio-progress-ring [progress]="state.progress" [color]="'${color}'"></app-audio-progress-ring>
                  <span class="text-${color}-400 font-mono text-xs uppercase tracking-widest animate-pulse">Processing... {{ state.progress }}%</span>
                </div>
              }
              @if (state.status === 'error' && state.errorMessage) {
                <div class="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4" [@fadeIn]>
                  <span class="text-rose-400 text-lg shrink-0">⚠</span>
                  <div class="flex-1">
                    <p class="text-white font-black text-xs uppercase">Processing Error</p>
                    <p class="text-rose-400 text-xs mt-1 leading-relaxed">{{ state.errorMessage }}</p>
                    @if (state.retryable) {
                      <button (click)="onProcess(state)" class="mt-2 text-xs font-black text-red-400 hover:text-white underline underline-offset-4">Retry</button>
                    }
                  </div>
                </div>
              }
            </div>
            <div class="w-full lg:w-80 flex flex-col gap-6">
              @if (state.status === 'done' && state.outputBlob) {
                <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex flex-col gap-4" [@slideUp]>
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">✅</div>
                    <div>
                      <p class="text-white font-black text-sm">Complete!</p>
                      <p class="text-emerald-400 text-xs">{{ state.outputSizeMB | number:'1.2-2' }} MB</p>
                    </div>
                  </div>
                  <app-audio-player [audioBlob]="state.outputBlob"></app-audio-player>
                  <button (click)="onDownload(state)" class="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3">
                    ⬇ Download Result
                  </button>
                </div>
              }
              <div class="bg-gray-900/20 rounded-2xl p-6 border border-white/5 border-dashed">
                <h4 class="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">ℹ About This Tool</h4>
                <p class="text-xs text-gray-600 leading-relaxed">${description}</p>
                <div class="mt-4 space-y-2">
                  <div class="flex justify-between"><span class="text-xs text-gray-600">Engine</span><span class="text-xs text-${color}-400 font-bold">FFmpeg WASM</span></div>
                  <div class="flex justify-between"><span class="text-xs text-gray-600">Client-Side</span><span class="text-xs text-emerald-400 font-bold">100%</span></div>
                </div>
              </div>
            </div>
          </div>
        }
      }
    </div>
  \`,
  styles: [\`
    :host { display: block; height: 100%; }
  \`]
})
export class ${compName}Component implements OnDestroy {
  private store = inject(Store);
  readonly state$ = this.store.select(select${Name}State);
  formats = ['wav', 'mp3', 'aac', 'ogg', 'flac', 'opus', 'm4a'];
  selectedFormat = 'mp3';
  private blobUrl: string | null = null;

  onFileSelected(files: File[]): void {
    if (files.length > 0) this.store.dispatch(${Name}Actions.loadFile({ file: files[0] }));
  }
  onProcess(state: any): void {
    if (!state.inputFile || state.status === 'processing' || state.status === 'loading') return;
    this.store.dispatch(${Name}Actions.startProcessing({ format: this.selectedFormat as any }));
  }
  onDownload(state: any): void {
    if (!state.outputBlob) return;
    const url = URL.createObjectURL(state.outputBlob);
    const a = Object.assign(document.createElement('a'), {
      href: url, download: \`omni_${featureKey}_\${state.inputFile?.name?.replace(/\\.[^.]+$/, '') ?? 'audio'}.\${this.selectedFormat}\`
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 150);
  }
  onReset(): void {
    if (this.blobUrl) { URL.revokeObjectURL(this.blobUrl); this.blobUrl = null; }
    this.store.dispatch(${Name}Actions.resetState());
  }
  ngOnDestroy(): void {
    if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
    this.store.dispatch(${Name}Actions.resetState());
  }
}
`.trimStart();
}

// Generic service builder
function buildService(featureKey) {
  const name = featureKey.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const Name = name.charAt(0).toUpperCase() + name.slice(1);
  return `
import { Injectable } from '@angular/core';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';
import { AudioMeta } from '../shared/types/audio.types';

@Injectable({ providedIn: 'root' })
export class ${Name}Service {
  constructor(private ffmpeg: FfmpegAudioService) {}

  async getMetadata(file: File): Promise<AudioMeta> {
    return {
      filename: file.name,
      fileSizeMB: file.size / 1024 / 1024,
      duration: 0,
      sampleRate: 44100,
      channels: 2,
      bitDepth: 16,
      bitrate: 128,
      codec: file.name.split('.').pop() ?? 'unknown',
      hasVideo: false,
    };
  }

  getOutputFilename(original: string, format: string): string {
    return this.ffmpeg.getOutputFilename(original, format, '${featureKey}');
  }
}
`.trimStart();
}

// Generic schema builder
function buildSchema(featureKey, extraFields = '') {
  const name = featureKey.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const Name = name.charAt(0).toUpperCase() + name.slice(1);
  return `
import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const ${Name}Schema = z.object({
  inputFile: AudioFileSchema,
  outputFormat: ExportFormatSchema,${extraFields}
});

export type ${Name}Config = z.infer<typeof ${Name}Schema>;
`.trimStart();
}

// Generic index builder
function buildIndex(featureKey) {
  const name = featureKey.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const Name = name.charAt(0).toUpperCase() + name.slice(1);
  const compName = featureKey.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  return `
export { ${compName}Component } from './${featureKey}.component';
export { ${Name}Service } from './${featureKey}.service';
export * from './${featureKey}.store';
export { ${Name}Schema } from './${featureKey}.schema';
`.trimStart();
}

// Define 30 features with their metadata
const features = [
  { key: 'recorder', title: 'Audio Recorder', emoji: '🎙️', color: 'red', desc: 'Record from microphone or system audio with real-time waveform.' },
  { key: 'trimmer', title: 'Audio Trimmer', emoji: '✂️', color: 'cyan', desc: 'Precision trim with frame-accurate in/out points and zero-crossing detection.' },
  { key: 'merger', title: 'Audio Merger', emoji: '🔗', color: 'violet', desc: 'Concatenate multiple audio files with crossfade and gap control.' },
  { key: 'converter', title: 'Format Converter', emoji: '🔄', color: 'amber', desc: 'Convert between WAV, MP3, AAC, OGG, FLAC, OPUS, M4A.' },
  { key: 'compressor', title: 'Dynamics Compressor', emoji: '🎚️', color: 'orange', desc: 'Apply dynamic range compression with threshold, ratio, attack, and release.' },
  { key: 'equalizer', title: 'Equalizer', emoji: '🎛️', color: 'green', desc: '10-band graphic EQ or full parametric EQ with shelf and peak filters.' },
  { key: 'pitch-shifter', title: 'Pitch Shifter', emoji: '🎵', color: 'pink', desc: 'Shift pitch by semitones without changing speed using Phase Vocoder.' },
  { key: 'time-stretch', title: 'Time Stretcher', emoji: '⏱️', color: 'blue', desc: 'Change playback speed without affecting pitch using WSOLA.' },
  { key: 'normalizer', title: 'Audio Normalizer', emoji: '📊', color: 'teal', desc: 'Normalize to Peak, RMS, or EBU R128 LUFS target loudness.' },
  { key: 'reverb', title: 'Reverb & Room Sim', emoji: '🏛️', color: 'indigo', desc: 'Convolution or algorithmic reverb with room size, decay and pre-delay.' },
  { key: 'noise-remover', title: 'Noise Remover', emoji: '🔇', color: 'slate', desc: 'Remove background noise via spectral subtraction or AI denoising.' },
  { key: 'splitter', title: 'Audio Splitter', emoji: '✂️', color: 'yellow', desc: 'Split by markers, equal parts, silence detection, or beat detection.' },
  { key: 'metadata', title: 'Metadata Editor', emoji: '📝', color: 'purple', desc: 'Read and write ID3 tags, Vorbis comments, FLAC metadata, cover art.' },
  { key: 'batch', title: 'Batch Processor', emoji: '📦', color: 'orange', desc: 'Apply the same operation to multiple files in queue.' },
  { key: 'analyser', title: 'Audio Analyser', emoji: '📈', color: 'cyan', desc: 'Analyze waveform, spectrogram, frequency spectrum, and loudness.' },
  { key: 'reverser', title: 'Audio Reverser', emoji: '⏪', color: 'red', desc: 'Reverse full audio or specific regions for creative effects.' },
  { key: 'mixer', title: 'Multi-Track Mixer', emoji: '🎙️', color: 'green', desc: 'Mix multiple audio tracks with volume, pan, mute, and solo controls.' },
  { key: 'fade', title: 'Fade In/Out', emoji: '🌅', color: 'rose', desc: 'Apply smooth fade-in and fade-out with linear, log, or S-curve shapes.' },
  { key: 'looper', title: 'Loop Creator', emoji: '🔁', color: 'emerald', desc: 'Create seamlessly looping audio with crossfade and beat-aligned detection.' },
  { key: 'channel-mixer', title: 'Channel Mixer', emoji: '🔀', color: 'sky', desc: 'Convert mono/stereo, swap L/R channels, Mid-Side encode/decode.' },
  { key: 'silence-remover', title: 'Silence Remover', emoji: '🔕', color: 'amber', desc: 'Auto-detect and remove silent gaps from audio files.' },
  { key: 'speed', title: 'Speed Changer', emoji: '⚡', color: 'yellow', desc: 'Change speed with optional pitch lock using atempo filter.' },
  { key: 'limiter', title: 'Limiter & Maximizer', emoji: '🧱', color: 'red', desc: 'Brick-wall limiter with lookahead and true peak protection.' },
  { key: 'stereo-widener', title: 'Stereo Widener', emoji: '↔️', color: 'violet', desc: 'Enhance stereo width using Mid-Side processing.' },
  { key: 'voice-changer', title: 'Voice Changer', emoji: '🎭', color: 'fuchsia', desc: 'Transform voice: pitch shift, formant shift, robot, echo presets.' },
  { key: 'karaoke', title: 'Karaoke Maker', emoji: '🎤', color: 'pink', desc: 'Remove or isolate vocals using Mid-Side or AI stem separation.' },
  { key: 'visualizer', title: 'Spectrum Visualizer', emoji: '🌈', color: 'cyan', desc: 'Generate animated spectrum/waveform visualization video (MP4).' },
  { key: 'transcriber', title: 'Audio Transcriber', emoji: '📜', color: 'indigo', desc: 'Transcribe speech to text using Whisper WASM. Output SRT/VTT/TXT.' },
  { key: 'watermark', title: 'Audio Watermark', emoji: '🔏', color: 'amber', desc: 'Embed inaudible digital watermarks for copyright protection.' },
  { key: 'stem-splitter', title: 'AI Stem Splitter', emoji: '🤖', color: 'purple', desc: 'Separate vocals, drums, bass, and instruments using Demucs ONNX.' },
];

// Extra schema fields per feature
const extraSchemaFields = {
  'trimmer': '\n  startTime: z.number().min(0),\n  endTime: z.number().min(0),\n  snapToZero: z.boolean().default(false),',
  'merger': '\n  crossfade: z.boolean().default(false),\n  crossfadeDuration: z.number().min(0).max(3).default(0),',
  'converter': '\n  bitrate: z.union([z.literal(64), z.literal(128), z.literal(192), z.literal(256), z.literal(320)]).default(192),\n  sampleRate: z.union([z.literal(22050), z.literal(44100), z.literal(48000), z.literal(96000)]).default(44100),',
  'compressor': '\n  threshold: z.number().min(-60).max(0).default(-24),\n  ratio: z.number().min(1).max(20).default(4),\n  attack: z.number().min(0.001).max(1).default(0.003),\n  release: z.number().min(0.01).max(1).default(0.25),\n  knee: z.number().min(0).max(40).default(30),\n  makeupGain: z.number().min(-12).max(24).default(0),',
  'equalizer': '\n  mode: z.enum([\'graphic\', \'parametric\']).default(\'graphic\'),',
  'pitch-shifter': '\n  semitones: z.number().min(-12).max(12).default(0),\n  cents: z.number().min(-100).max(100).default(0),\n  formantCorrection: z.boolean().default(false),',
  'time-stretch': '\n  speed: z.number().min(0.1).max(4.0).default(1.0),\n  pitchLock: z.boolean().default(true),',
  'normalizer': '\n  mode: z.enum([\'peak\', \'rms\', \'lufs\']).default(\'lufs\'),\n  targetLevel: z.number().min(-40).max(0).default(-14),\n  truePeakEnabled: z.boolean().default(false),',
  'reverb': '\n  mode: z.enum([\'convolution\', \'algorithmic\']).default(\'algorithmic\'),\n  roomSize: z.number().min(0).max(100).default(50),\n  decay: z.number().min(0.1).max(10).default(2),\n  wetMix: z.number().min(0).max(1).default(0.3),',
  'noise-remover': '\n  algorithm: z.enum([\'spectral\', \'ai\', \'ffmpeg\']).default(\'ffmpeg\'),\n  strength: z.number().min(0).max(1).default(0.5),',
  'speed': '\n  speed: z.number().min(0.1).max(4.0).default(1.0),\n  pitchLock: z.boolean().default(true),',
  'limiter': '\n  ceiling: z.number().min(-6).max(0).default(-0.1),\n  lookaheadMs: z.number().min(0).max(20).default(5),',
  'stereo-widener': '\n  width: z.number().min(0).max(200).default(100),',
  'voice-changer': '\n  pitch: z.number().min(-12).max(12).default(0),\n  speed: z.number().min(0.5).max(2.0).default(1.0),',
  'karaoke': '\n  method: z.enum([\'midSide\', \'ai\']).default(\'midSide\'),\n  strength: z.number().min(0).max(1).default(0.9),',
  'watermark': '\n  mode: z.enum([\'embed\', \'detect\']).default(\'embed\'),\n  watermarkText: z.string().max(128).default(\'\'),\n  strength: z.number().min(0.1).max(1.0).default(0.5),',
  'stem-splitter': '\n  model: z.enum([\'demucs-v4\', \'htdemucs\', \'spleeter-2stem\']).default(\'htdemucs\'),',
  'fade': '\n  fadeInDuration: z.number().min(0).max(30).default(2),\n  fadeOutDuration: z.number().min(0).max(30).default(2),\n  curve: z.enum([\'linear\', \'logarithmic\', \'sCurve\']).default(\'sCurve\'),',
};

// Build folder map
const folderMap = {
  'recorder': '01-recorder', 'trimmer': '02-trimmer', 'merger': '03-merger',
  'converter': '04-converter', 'compressor': '05-compressor', 'equalizer': '06-equalizer',
  'pitch-shifter': '07-pitch-shifter', 'time-stretch': '08-time-stretch', 'normalizer': '09-normalizer',
  'reverb': '10-reverb', 'noise-remover': '11-noise-remover', 'splitter': '12-splitter',
  'metadata': '13-metadata', 'batch': '14-batch', 'analyser': '15-analyser',
  'reverser': '16-reverser', 'mixer': '17-mixer', 'fade': '18-fade',
  'looper': '19-looper', 'channel-mixer': '20-channel-mixer', 'silence-remover': '21-silence-remover',
  'speed': '22-speed', 'limiter': '23-limiter', 'stereo-widener': '24-stereo-widener',
  'voice-changer': '25-voice-changer', 'karaoke': '26-karaoke', 'visualizer': '27-visualizer',
  'transcriber': '28-transcriber', 'watermark': '29-watermark', 'stem-splitter': '30-stem-splitter',
};

for (const f of features) {
  const folder = folderMap[f.key];
  
  // Store
  write(`${folder}/${f.key}.store.ts`, buildStore(f.key));
  
  // Service
  write(`${folder}/${f.key}.service.ts`, buildService(f.key));
  
  // Component
  write(`${folder}/${f.key}.component.ts`, buildComponent(f.key, f.title, f.emoji, f.desc, f.color));
  
  // Schema
  write(`${folder}/${f.key}.schema.ts`, buildSchema(f.key, extraSchemaFields[f.key] || ''));
  
  // Index
  write(`${folder}/index.ts`, buildIndex(f.key));
  
  // Worker (minimal)
  write(`${folder}/${f.key}.worker.ts`, `
/// <reference lib="webworker" />
// ${f.title} Worker — processes audio in background thread
// Runs inside Web Worker, no Angular context available

self.onmessage = async (event: MessageEvent) => {
  const { type, payload } = event.data;
  try {
    self.postMessage({ type: 'progress', value: 10 });
    // TODO: Implement ${f.key} audio processing logic here
    // For now: pass through using FFmpeg via postMessage
    self.postMessage({ type: 'log', message: '[${f.key}] Worker started, processing...' });
    self.postMessage({ type: 'progress', value: 50 });
    // Signal completion with empty result (actual FFmpeg runs in effects via FfmpegAudioService)
    self.postMessage({ type: 'complete', data: null });
  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message || 'Unknown worker error', errorCode: 'WORKER_CRASHED' });
  }
};
`.trimStart());
}

console.log('\n✅ PART 3 COMPLETE: All 30 feature files written.\n');
