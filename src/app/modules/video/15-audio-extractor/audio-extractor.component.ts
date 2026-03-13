import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';

type AudioFormat = 'mp3' | 'aac' | 'wav' | 'ogg' | 'flac';

interface AudioExtractorState { status: 'idle'|'processing'|'success'|'error'; progress: number; inputFile: File|null; outputBlob: Blob|null; outputFormat: AudioFormat; bitrate: number; }
const initialState: AudioExtractorState = { status: 'idle', progress: 0, inputFile: null, outputBlob: null, outputFormat: 'mp3', bitrate: 320 };

const AudioExtractorActions = createActionGroup({ source: 'AudioExtractor', events: {
  'Load File': props<{ file: File }>(),
  'Set Format': props<{ outputFormat: AudioFormat }>(),
  'Set Bitrate': props<{ bitrate: number }>(),
  'Start Processing': emptyProps(),
  'Update Progress': props<{ progress: number }>(),
  'Processing Success': props<{ outputBlob: Blob }>(),
  'Processing Failure': props<{ message: string }>(),
  'Reset State': emptyProps(),
}});

const audioExtractorFeature = createFeature({ name: 'audioExtractor', reducer: createReducer(initialState,
  on(AudioExtractorActions.loadFile, (s, { file }) => ({ ...s, inputFile: file })),
  on(AudioExtractorActions.setFormat, (s, { outputFormat }) => ({ ...s, outputFormat })),
  on(AudioExtractorActions.setBitrate, (s, { bitrate }) => ({ ...s, bitrate })),
  on(AudioExtractorActions.startProcessing, (s) => ({ ...s, status: 'processing', progress: 0 })),
  on(AudioExtractorActions.updateProgress, (s, { progress }) => ({ ...s, progress })),
  on(AudioExtractorActions.processingSuccess, (s, { outputBlob }) => ({ ...s, status: 'success', outputBlob, progress: 100 })),
  on(AudioExtractorActions.processingFailure, (s) => ({ ...s, status: 'error' })),
  on(AudioExtractorActions.resetState, () => initialState),
)});

const AUDIO_FORMATS: AudioFormat[] = ['mp3', 'aac', 'wav', 'ogg', 'flac'];
const BITRATES = [128, 192, 256, 320];

@Component({
  selector: 'app-audio-extractor',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent pb-1">Extract Audio</h2>
        <p class="text-gray-400 text-sm mt-1">Demux audio track from any video using FFmpeg -vn flag. Zero quality loss.</p>
      </div>

      @if (vm$ | async; as vm) {
        @if (!vm.inputFile) {
          <div class="flex-1 flex flex-col justify-center">
            <app-file-drop-zone accept="video/*" (fileDropped)="onFile($event)"></app-file-drop-zone>
          </div>
        } @else {
          <div class="flex flex-col lg:flex-row gap-6">
            <div class="flex-1"><app-video-preview [videoUrl]="videoUrl"></app-video-preview></div>
            <div class="w-full lg:w-72 flex flex-col gap-4">
              <!-- Format Selection -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <label class="block text-sm font-semibold text-gray-300 mb-3">Output Format</label>
                <div class="grid grid-cols-3 gap-2">
                  @for (fmt of formats; track fmt) {
                    <button (click)="setFormat(fmt)"
                      [class]="vm.outputFormat === fmt ? 'bg-emerald-600 text-white font-bold shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
                      class="py-2 rounded-lg text-sm font-mono transition-all uppercase">{{ fmt }}</button>
                  }
                </div>
              </div>
              <!-- Bitrate (not for WAV/FLAC) -->
              @if (vm.outputFormat !== 'wav' && vm.outputFormat !== 'flac') {
                <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
                  <label class="block text-sm font-semibold text-gray-300 mb-3">Bitrate</label>
                  <div class="grid grid-cols-2 gap-2">
                    @for (br of bitrates; track br) {
                      <button (click)="setBitrate(br)"
                        [class]="vm.bitrate === br ? 'bg-emerald-600 text-white font-bold' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
                        class="py-2 rounded-lg text-sm font-mono transition-all">{{ br }} kbps</button>
                    }
                  </div>
                </div>
              }
              <!-- Info Panel -->
              <div class="bg-gray-950 rounded-xl p-4 border border-gray-700">
                <p class="text-xs text-gray-500 mb-2 uppercase tracking-wider">FFmpeg Command</p>
                <p class="font-mono text-xs text-emerald-300 break-all">ffmpeg -i input.mp4 -vn -acodec {{ getCodec(vm.outputFormat) }} @if (vm.outputFormat !== 'wav' && vm.outputFormat !== 'flac') { -ab {{ vm.bitrate }}k } output.{{ vm.outputFormat }}</p>
              </div>

              @if (vm.status === 'processing') {
                <div class="bg-gray-800 rounded-xl p-6 flex flex-col items-center"><app-progress-ring [progress]="vm.progress" [status]="'Extracting audio...'"></app-progress-ring></div>
              } @else if (vm.status === 'success') {
                <button (click)="onDownload(vm)" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  Download {{ vm.outputFormat.toUpperCase() }}
                </button>
                <button (click)="onReset()" class="text-sm text-center text-gray-400 hover:text-white">Try Another</button>
              } @else {
                <button (click)="onProcess(vm)" class="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all active:scale-95">
                  🎵 Extract Audio
                </button>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AudioExtractorComponent {
  private store = inject(Store);
  private workerBridge = inject(WorkerBridgeService);
  readonly vm$ = this.store.select(audioExtractorFeature.selectAudioExtractorState);
  videoUrl: string | null = null;
  readonly formats = AUDIO_FORMATS;
  readonly bitrates = BITRATES;

  getCodec(fmt: AudioFormat): string {
    const map: Record<AudioFormat, string> = { mp3: 'libmp3lame', aac: 'aac', wav: 'pcm_s16le', ogg: 'libvorbis', flac: 'flac' };
    return map[fmt];
  }

  setFormat(outputFormat: AudioFormat): void { this.store.dispatch(AudioExtractorActions.setFormat({ outputFormat })); }
  setBitrate(bitrate: number): void { this.store.dispatch(AudioExtractorActions.setBitrate({ bitrate })); }

  onFile(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(AudioExtractorActions.loadFile({ file }));
  }

  onProcess(state: AudioExtractorState): void {
    this.store.dispatch(AudioExtractorActions.startProcessing());
    if (state.inputFile) {
      const worker = new Worker(new URL('./audio-extractor.worker', import.meta.url), { type: 'module' });
      this.workerBridge.runTask(worker, { file: state.inputFile, outputFormat: state.outputFormat, bitrate: state.bitrate }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') this.store.dispatch(AudioExtractorActions.updateProgress({ progress: msg.value }));
          else if (msg.type === 'complete') this.store.dispatch(AudioExtractorActions.processingSuccess({ outputBlob: new Blob([msg.data as BlobPart], { type: `audio/${state.outputFormat}` }) }));
        },
        error: (err) => this.store.dispatch(AudioExtractorActions.processingFailure({ message: err.message }))
      });
    }
  }

  onDownload(state: AudioExtractorState): void {
    if (state.outputBlob) { const url = URL.createObjectURL(state.outputBlob); const a = Object.assign(document.createElement('a'), { href: url, download: `omni_audio.${state.outputFormat}` }); document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 150); }
  }

  onReset(): void { if (this.videoUrl) { URL.revokeObjectURL(this.videoUrl); this.videoUrl = null; } this.store.dispatch(AudioExtractorActions.resetState()); }
}