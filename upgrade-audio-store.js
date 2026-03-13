const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, 'src/app/modules/audio');

const features = [
  { num: '01', slug: 'recorder', name: 'Recorder', ffmpegArgs: ['-i', '{in}'] },
  { num: '02', slug: 'trimmer', name: 'Trimmer', ffmpegArgs: ['-i', '{in}', '-ss', '00:00:05', '-t', '00:00:15'] },
  { num: '03', slug: 'merger', name: 'Merger', ffmpegArgs: ['-i', '{in}'] },
  { num: '04', slug: 'converter', name: 'Converter', ffmpegArgs: ['-i', '{in}'] },
  { num: '05', slug: 'compressor', name: 'Compressor', ffmpegArgs: ['-i', '{in}', '-af', 'acompressor'] },
  { num: '06', slug: 'equalizer', name: 'Equalizer', ffmpegArgs: ['-i', '{in}', '-af', 'equalizer=f=1000:width_type=h:width=200:g=-3'] },
  { num: '07', slug: 'pitch-shifter', name: 'PitchShifter', ffmpegArgs: ['-i', '{in}', '-af', 'asetrate=44100*1.25,aresample=44100'] },
  { num: '08', slug: 'time-stretch', name: 'TimeStretch', ffmpegArgs: ['-i', '{in}', '-af', 'atempo=1.5'] },
  { num: '09', slug: 'normalizer', name: 'Normalizer', ffmpegArgs: ['-i', '{in}', '-af', 'loudnorm'] },
  { num: '10', slug: 'reverb', name: 'Reverb', ffmpegArgs: ['-i', '{in}', '-af', 'aecho=0.8:0.9:1000:0.3'] },
  { num: '11', slug: 'noise-remover', name: 'NoiseRemover', ffmpegArgs: ['-i', '{in}', '-af', 'afftdn'] },
  { num: '12', slug: 'splitter', name: 'Splitter', ffmpegArgs: ['-i', '{in}', '-t', '10'] },
  { num: '13', slug: 'metadata', name: 'Metadata', ffmpegArgs: ['-i', '{in}', '-map_metadata', '0'] },
  { num: '14', slug: 'batch', name: 'Batch', ffmpegArgs: ['-i', '{in}'] },
  { num: '15', slug: 'analyser', name: 'Analyser', ffmpegArgs: ['-i', '{in}'] },
  { num: '16', slug: 'reverser', name: 'Reverser', ffmpegArgs: ['-i', '{in}', '-af', 'areverse'] },
  { num: '17', slug: 'mixer', name: 'Mixer', ffmpegArgs: ['-i', '{in}', '-ac', '2'] },
  { num: '18', slug: 'fade', name: 'Fade', ffmpegArgs: ['-i', '{in}', '-af', 'afade=t=in:ss=0:d=3,afade=t=out:st=10:d=3'] },
  { num: '19', slug: 'looper', name: 'Looper', ffmpegArgs: ['-stream_loop', '3', '-i', '{in}'] },
  { num: '20', slug: 'channel-mixer', name: 'ChannelMixer', ffmpegArgs: ['-i', '{in}', '-ac', '1'] },
  { num: '21', slug: 'silence-remover', name: 'SilenceRemover', ffmpegArgs: ['-i', '{in}', '-af', 'silenceremove=stop_periods=-1:stop_duration=1:stop_threshold=-50dB'] },
  { num: '22', slug: 'speed', name: 'Speed', ffmpegArgs: ['-i', '{in}', '-af', 'atempo=2.0'] },
  { num: '23', slug: 'limiter', name: 'Limiter', ffmpegArgs: ['-i', '{in}', '-af', 'alimiter=limit=-1dB'] },
  { num: '24', slug: 'stereo-widener', name: 'StereoWidener', ffmpegArgs: ['-i', '{in}', '-af', 'extrastereo=m=2.5'] },
  { num: '25', slug: 'voice-changer', name: 'VoiceChanger', ffmpegArgs: ['-i', '{in}', '-af', 'asetrate=44100*0.8,aresample=44100,aecho=0.8:0.9:1000:0.3'] },
  { num: '26', slug: 'karaoke', name: 'Karaoke', ffmpegArgs: ['-i', '{in}', '-af', 'pan=stereo|c0=c0-c1|c1=c0-c1'] },
  { num: '27', slug: 'visualizer', name: 'Visualizer', ffmpegArgs: ['-i', '{in}'] },
  { num: '28', slug: 'transcriber', name: 'Transcriber', ffmpegArgs: ['-i', '{in}'] },
  { num: '29', slug: 'watermark', name: 'Watermark', ffmpegArgs: ['-i', '{in}'] },
  { num: '30', slug: 'stem-splitter', name: 'StemSplitter', ffmpegArgs: ['-i', '{in}'] }
];

function write(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

function genStore(f) {
  return `import { inject } from '@angular/core';
import { createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, of, Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AudioErrorCode, ProcessingStatus, ExportFormat } from '../shared/types/audio.types';
import { FfmpegAudioService } from '../shared/engine/ffmpeg-audio.service';

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
    'Start Processing': props<{ format: ExportFormat }>(),
    'Update Progress': props<{ value: number }>(),
    'Processing Success': props<{ outputBlob: Blob; outputSizeMB: number }>(),
    'Processing Failure': props<{ errorCode: AudioErrorCode; message: string; retryable: boolean }>(),
    'Reset State': emptyProps(),
  },
});

// ─── Reducer ─────────────────────────────────────────────────────────────────
export const ${f.slug.replace('-', '').toLowerCase()}Reducer = createReducer(
  initialState,
  on(${f.name}Actions.loadFile, (state, { file }) => ({ ...state, inputFile: file, status: 'idle' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
  on(${f.name}Actions.startProcessing, (state) => ({ ...state, status: 'processing' as ProcessingStatus, progress: 0, outputBlob: null, errorCode: null, errorMessage: null })),
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

// ─── Effects ─────────────────────────────────────────────────────────────────
export const ${f.slug.replace('-', '').toLowerCase()}ProcessingEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), ffmpeg = inject(FfmpegAudioService)) => {
    return actions$.pipe(
      ofType(${f.name}Actions.startProcessing),
      withLatestFrom(store.select(select${f.name}State)),
      concatMap(([{ format }, state]) => {
        if (!state.inputFile) {
          return of(${f.name}Actions.processingFailure({ errorCode: 'INVALID_PARAMS', message: 'No input file selected', retryable: false }));
        }
        
        return new Observable<any>(obs => {
          let aborted = false;
          const args = ${JSON.stringify(f.ffmpegArgs)}; // Feature-specific FFmpeg args
          
          ffmpeg.processAudio(
            state.inputFile!,
            format,
            args,
            (p) => { if (!aborted) store.dispatch(${f.name}Actions.updateProgress({ value: p })); }
          ).then(blob => {
            if (!aborted) {
              obs.next(${f.name}Actions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 }));
              obs.complete();
            }
          }).catch(err => {
            if (!aborted) {
              obs.next(${f.name}Actions.processingFailure({ errorCode: 'ENCODE_FAILED', message: err.message || 'Validation failed or FFmpeg crashed', retryable: true }));
              obs.complete();
            }
          });

          return () => { aborted = true; };
        });
      })
    );
  },
  { functional: true }
);
`;
}

// Removing duplicate genComponentUpdate
// 1. Rewrite specific component methods
for (const f of features) {
  const dir = path.join(BASE, `${f.num}-${f.slug}`);
  const compPath = path.join(dir, `${f.slug}.component.ts`);
  const storePath = path.join(dir, `${f.slug}.store.ts`);
  
  // Rewrite Store completely
  write(storePath, genStore(f));
  
  // Update Component onProcess
  if (fs.existsSync(compPath)) {
    write(compPath, genComponentUpdate(compPath, f));
  }
}

// Helper to pass f
function genComponentUpdate(fPath, f) {
  let content = fs.readFileSync(fPath, 'utf8');
  const methodStart = content.indexOf('onProcess(state: ');
  const methodEnd = content.indexOf('onDownload', methodStart);
  if (methodStart !== -1 && methodEnd !== -1) {
    const newMethod = `onProcess(state: any): void {
    if (!state.inputFile || state.status === 'processing' || state.status === 'loading') return;
    this.store.dispatch({ type: '[${f.name}] Start Processing', format: this.selectedFormat });
  }

  `;
    content = content.substring(0, methodStart) + newMethod + content.substring(methodEnd);
  }
  return content;
}

// 2. Write the REAL FfmpegAudioService
const fmpegPath = path.join(BASE, 'shared', 'engine', 'ffmpeg-audio.service.ts');
write(fmpegPath, `import { Injectable, signal } from '@angular/core';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { ExportFormat } from '../types/audio.types';

@Injectable({ providedIn: 'root' })
export class FfmpegAudioService {
  private ffmpeg = new FFmpeg();
  private loaded = false;
  
  readonly isReady = signal(false);

  constructor() {
    this.ffmpeg.on('log', ({ message }) => console.log('[FFmpeg]', message));
  }

  async load(): Promise<void> {
    if (this.loaded) return;
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await this.ffmpeg.load({
      coreURL: await toBlobURL(\`\${baseURL}/ffmpeg-core.js\`, 'text/javascript'),
      wasmURL: await toBlobURL(\`\${baseURL}/ffmpeg-core.wasm\`, 'application/wasm'),
    });
    this.loaded = true;
    this.isReady.set(true);
  }

  async processAudio(
    inputFile: File, 
    format: ExportFormat, 
    ffmpegArgs: string[], 
    onProgress: (p: number) => void
  ): Promise<Blob> {
    await this.load();
    const inName = 'input_' + Date.now() + this.getExt(inputFile.name);
    const outName = 'output_' + Date.now() + '.' + format;
    
    const progressHandler = ({ progress }: any) => {
      onProgress(Math.min(100, Math.round(progress * 100)));
    };
    this.ffmpeg.on('progress', progressHandler);
    
    await this.ffmpeg.writeFile(inName, await fetchFile(inputFile));
    
    // Replace {in} and {out} with actual filenames
    const args = ffmpegArgs.map(a => a === '{in}' ? inName : a === '{out}' ? outName : a);
    if (!args.includes(outName)) args.push(outName); // default output placement

    try {
      await this.ffmpeg.exec(args);
      const data = await this.ffmpeg.readFile(outName);
      return new Blob([(data as Uint8Array).buffer as ArrayBuffer], { type: \`audio/\${format}\` });
    } finally {
      this.ffmpeg.off('progress', progressHandler);
      try { await this.ffmpeg.deleteFile(inName); } catch (e) {}
      try { await this.ffmpeg.deleteFile(outName); } catch (e) {}
    }
  }

  getOutputFilename(original: string, format: string, op: string): string {
    const base = original.replace(/\\.[^.]+$/, '');
    return \`omni_\${op}_\${base}.\${format}\`;
  }

  private getExt(filename: string) {
    const match = filename.match(/\\.[^.]+$/);
    return match ? match[0] : '.mp3';
  }
}
`);

// 3. Re-write audio.routes.ts to include the new effects via provideEffects()
let routesContent = fs.readFileSync(path.join(BASE, 'audio.routes.ts'), 'utf8');

// I will insert \`import { provideEffects } from '@ngrx/effects';\` and append the effects to each folder import.
// Using regex to replace the imports:
const slugMap = {
  '07-pitch-shifter': 'pitchshifter',
  '08-time-stretch': 'timestretch',
  '11-noise-remover': 'noiseremover',
  '20-channel-mixer': 'channelmixer',
  '21-silence-remover': 'silenceremover',
  '22-speed': 'speed',
  '24-stereo-widener': 'stereowidener',
  '25-voice-changer': 'voicechanger',
  '27-visualizer': 'visualizer',
  '28-transcriber': 'transcriber',
  '29-watermark': 'watermark',
  '30-stem-splitter': 'stemsplitter',
};

// First, regenerate audio.routes.ts cleanly
// First, regenerate audio.routes.ts cleanly
let newRoutes = `import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { Routes } from '@angular/router';\n`;

features.forEach(f => {
    const reducedName = f.slug.replace('-', '').toLowerCase();
    newRoutes += `import { ${reducedName}Reducer, ${reducedName}ProcessingEffect } from './${f.num}-${f.slug}/${f.slug}.store';\n`;
});

newRoutes += `
export const AUDIO_ROUTES: Routes = [
  {
    path: '',
    providers: [\n`;

features.forEach(f => {
    const reducedName = f.slug.replace('-', '').toLowerCase();
    newRoutes += `      provideState('${f.slug}', ${reducedName}Reducer),\n`;
});
newRoutes += `      provideEffects({\n`;
features.forEach(f => {
    const reducedName = f.slug.replace('-', '').toLowerCase();
    newRoutes += `        ${reducedName}ProcessingEffect,\n`;
});
newRoutes += `      })
    ],
    children: [\n`;

features.forEach(f => {
    newRoutes += `      { path: '${f.slug}', loadComponent: () => import('./${f.num}-${f.slug}/${f.slug}.component').then(m => m.${f.name}Component), title: '${f.title} — Omni-Tool', data: { category: 'audio' } },\n`;
});

newRoutes += `      { path: '', redirectTo: 'recorder', pathMatch: 'full' }
    ]
  }
];
`;

write(path.join(BASE, 'audio.routes.ts'), newRoutes);
console.log('✅ All audio tools upgraded to use real FFmpeg and NgRx Effects!');
