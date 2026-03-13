import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';

interface SubtitleState { status: 'idle'|'processing'|'success'|'error'; progress: number; videoFile: File|null; srtFile: File|null; outputBlob: Blob|null; fontName: string; fontSize: number; fontColor: string; position: 'bottom'|'top'; }
const initialState: SubtitleState = { status: 'idle', progress: 0, videoFile: null, srtFile: null, outputBlob: null, fontName: 'Arial', fontSize: 24, fontColor: 'white', position: 'bottom' };

const SubtitleActions = createActionGroup({ source: 'SubtitleBurner', events: {
  'Load Video': props<{ file: File }>(),
  'Load Srt': props<{ file: File }>(),
  'Set Font Name': props<{ fontName: string }>(),
  'Set Font Size': props<{ fontSize: number }>(),
  'Set Font Color': props<{ fontColor: string }>(),
  'Set Position': props<{ position: 'bottom'|'top' }>(),
  'Start Processing': emptyProps(),
  'Update Progress': props<{ progress: number }>(),
  'Processing Success': props<{ outputBlob: Blob }>(),
  'Processing Failure': props<{ message: string }>(),
  'Reset State': emptyProps(),
}});

const subtitleFeature = createFeature({ name: 'subtitleBurner', reducer: createReducer(initialState,
  on(SubtitleActions.loadVideo, (s, { file }) => ({ ...s, videoFile: file })),
  on(SubtitleActions.loadSrt, (s, { file }) => ({ ...s, srtFile: file })),
  on(SubtitleActions.setFontName, (s, { fontName }) => ({ ...s, fontName })),
  on(SubtitleActions.setFontSize, (s, { fontSize }) => ({ ...s, fontSize })),
  on(SubtitleActions.setFontColor, (s, { fontColor }) => ({ ...s, fontColor })),
  on(SubtitleActions.setPosition, (s, { position }) => ({ ...s, position })),
  on(SubtitleActions.startProcessing, (s) => ({ ...s, status: 'processing', progress: 0 })),
  on(SubtitleActions.updateProgress, (s, { progress }) => ({ ...s, progress })),
  on(SubtitleActions.processingSuccess, (s, { outputBlob }) => ({ ...s, status: 'success', outputBlob, progress: 100 })),
  on(SubtitleActions.processingFailure, (s) => ({ ...s, status: 'error' })),
  on(SubtitleActions.resetState, () => initialState),
)});

const FONTS = ['Arial', 'Impact', 'Courier New', 'Georgia', 'Verdana'];
const COLORS = [
  { label: 'White', value: 'white' }, { label: 'Yellow', value: 'yellow' },
  { label: 'Black', value: 'black' }, { label: 'Red', value: 'red' }, { label: 'Cyan', value: 'cyan' }
];

@Component({
  selector: 'app-subtitle-burner',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent pb-1">Subtitle Burner</h2>
        <p class="text-gray-400 text-sm mt-1">Hard-burn SRT subtitles into video using FFmpeg drawtext / libass filter.</p>
      </div>

      @if (vm$ | async; as vm) {
        <div class="flex flex-col lg:flex-row gap-6">
          <div class="flex-1 flex flex-col gap-4">
            <!-- Video Drop -->
            @if (!vm.videoFile) {
              <app-file-drop-zone accept="video/*" (fileDropped)="onVideoFile($event)"></app-file-drop-zone>
            } @else {
              <app-video-preview [videoUrl]="videoUrl"></app-video-preview>
            }
            <!-- SRT Drop -->
            <div
              role="button" tabindex="0" aria-label="Drop SRT file"
              (click)="srtInput.click()" (keydown.enter)="srtInput.click()"
              [class]="vm.srtFile ? 'border-teal-500 bg-teal-900/20' : 'border-gray-600 hover:border-teal-400'"
              class="border-2 border-dashed rounded-xl p-6 flex items-center gap-4 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400">
              <div class="w-10 h-10 rounded-full bg-teal-900/40 flex items-center justify-center flex-shrink-0">
                <span class="text-teal-400 font-bold text-xs">SRT</span>
              </div>
              @if (vm.srtFile) {
                <div>
                  <p class="text-teal-300 font-medium">{{ vm.srtFile.name }}</p>
                  <p class="text-gray-500 text-xs">{{ (vm.srtFile.size / 1024).toFixed(1) }} KB</p>
                </div>
              } @else {
                <p class="text-gray-400">Drop SRT subtitle file here or click to browse</p>
              }
              <input #srtInput type="file" accept=".srt,.ass,.vtt" class="hidden" (change)="onSrtFile($event)">
            </div>
          </div>

          <div class="w-full lg:w-80 flex flex-col gap-4">
            <!-- Font Family -->
            <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <label class="block text-sm font-semibold text-gray-300 mb-2">Font Family</label>
              <select class="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-400 focus:outline-none"
                (change)="onFontChange($event)">
                @for (f of fonts; track f) {
                  <option [value]="f">{{ f }}</option>
                }
              </select>
            </div>
            <!-- Font Size -->
            <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div class="flex justify-between mb-2">
                <label class="text-sm font-semibold text-gray-300">Font Size</label>
                <span class="text-teal-400 font-mono font-bold">{{ vm.fontSize }}px</span>
              </div>
              <input type="range" min="12" max="72" [value]="vm.fontSize" (input)="onFontSize($event)" class="w-full accent-teal-400">
            </div>
            <!-- Color -->
            <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <label class="block text-sm font-semibold text-gray-300 mb-2">Font Color</label>
              <div class="flex gap-2 flex-wrap">
                @for (c of colors; track c.value) {
                  <button (click)="setColor(c.value)"
                    [class]="vm.fontColor === c.value ? 'ring-2 ring-white scale-110' : 'hover:scale-105'"
                    [style.background]="c.value === 'white' ? '#ffffff' : c.value"
                    class="w-8 h-8 rounded-full border border-gray-600 transition-transform">
                  </button>
                }
              </div>
            </div>
            <!-- Position -->
            <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <label class="block text-sm font-semibold text-gray-300 mb-2">Position</label>
              <div class="flex gap-2">
                <button (click)="setPosition('bottom')" [class]="vm.position === 'bottom' ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-300'"
                  class="flex-1 py-2 rounded-lg text-sm transition-all">⬇ Bottom</button>
                <button (click)="setPosition('top')" [class]="vm.position === 'top' ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-300'"
                  class="flex-1 py-2 rounded-lg text-sm transition-all">⬆ Top</button>
              </div>
            </div>

            @if (vm.status === 'processing') {
              <div class="bg-gray-800 rounded-xl p-6 flex flex-col items-center"><app-progress-ring [progress]="vm.progress" [status]="'Burning subtitles...'"></app-progress-ring></div>
            } @else if (vm.status === 'success') {
              <button (click)="onDownload(vm)" class="w-full bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-xl font-bold">Download with Subtitles</button>
              <button (click)="onReset()" class="text-sm text-center text-gray-400 hover:text-white">Try Another</button>
            } @else {
              <button (click)="onProcess(vm)" [disabled]="!vm.videoFile || !vm.srtFile"
                class="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(20,184,166,0.4)] transition-all active:scale-95 disabled:opacity-50">
                🎬 Burn Subtitles
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubtitleBurnerComponent {
  private store = inject(Store);
  private workerBridge = inject(WorkerBridgeService);
  readonly vm$ = this.store.select(subtitleFeature.selectSubtitleBurnerState);
  videoUrl: string | null = null;
  readonly fonts = FONTS;
  readonly colors = COLORS;

  onVideoFile(file: File): void { if (this.videoUrl) URL.revokeObjectURL(this.videoUrl); this.videoUrl = URL.createObjectURL(file); this.store.dispatch(SubtitleActions.loadVideo({ file })); }
  onSrtFile(e: Event): void { const f = (e.target as HTMLInputElement).files?.[0]; if (f) this.store.dispatch(SubtitleActions.loadSrt({ file: f })); }
  onFontChange(e: Event): void { this.store.dispatch(SubtitleActions.setFontName({ fontName: (e.target as HTMLSelectElement).value })); }
  onFontSize(e: Event): void { this.store.dispatch(SubtitleActions.setFontSize({ fontSize: +(e.target as HTMLInputElement).value })); }
  setColor(fontColor: string): void { this.store.dispatch(SubtitleActions.setFontColor({ fontColor })); }
  setPosition(position: 'bottom'|'top'): void { this.store.dispatch(SubtitleActions.setPosition({ position })); }

  onProcess(state: SubtitleState): void {
    this.store.dispatch(SubtitleActions.startProcessing());
    if (state.videoFile && state.srtFile) {
      const worker = new Worker(new URL('./subtitle-burner.worker', import.meta.url), { type: 'module' });
      this.workerBridge.runTask(worker, { videoFile: state.videoFile, srtFile: state.srtFile, fontName: state.fontName, fontSize: state.fontSize, fontColor: state.fontColor, position: state.position }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') this.store.dispatch(SubtitleActions.updateProgress({ progress: msg.value }));
          else if (msg.type === 'complete') this.store.dispatch(SubtitleActions.processingSuccess({ outputBlob: new Blob([msg.data as BlobPart], { type: 'video/mp4' }) }));
        },
        error: (err) => this.store.dispatch(SubtitleActions.processingFailure({ message: err.message }))
      });
    }
  }

  onDownload(state: SubtitleState): void {
    if (state.outputBlob) { const url = URL.createObjectURL(state.outputBlob); const a = Object.assign(document.createElement('a'), { href: url, download: 'omni_subtitled.mp4' }); document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 150); }
  }

  onReset(): void { if (this.videoUrl) { URL.revokeObjectURL(this.videoUrl); this.videoUrl = null; } this.store.dispatch(SubtitleActions.resetState()); }
}