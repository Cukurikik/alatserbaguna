import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';

interface GifState { status: 'idle'|'processing'|'success'|'error'; progress: number; inputFile: File|null; outputBlob: Blob|null; startTime: number; duration: number; fps: number; width: number; loop: boolean; }
const initialState: GifState = { status: 'idle', progress: 0, inputFile: null, outputBlob: null, startTime: 0, duration: 5, fps: 15, width: 480, loop: true };

const GifActions = createActionGroup({ source: 'VideoToGif', events: {
  'Load File': props<{ file: File }>(),
  'Set Start Time': props<{ startTime: number }>(),
  'Set Duration': props<{ duration: number }>(),
  'Set Fps': props<{ fps: number }>(),
  'Set Width': props<{ width: number }>(),
  'Toggle Loop': emptyProps(),
  'Start Processing': emptyProps(),
  'Update Progress': props<{ progress: number }>(),
  'Processing Success': props<{ outputBlob: Blob }>(),
  'Processing Failure': props<{ message: string }>(),
  'Reset State': emptyProps(),
}});

const gifFeature = createFeature({ name: 'videoToGif', reducer: createReducer(initialState,
  on(GifActions.loadFile, (s, { file }) => ({ ...s, inputFile: file })),
  on(GifActions.setStartTime, (s, { startTime }) => ({ ...s, startTime })),
  on(GifActions.setDuration, (s, { duration }) => ({ ...s, duration })),
  on(GifActions.setFps, (s, { fps }) => ({ ...s, fps })),
  on(GifActions.setWidth, (s, { width }) => ({ ...s, width })),
  on(GifActions.toggleLoop, (s) => ({ ...s, loop: !s.loop })),
  on(GifActions.startProcessing, (s) => ({ ...s, status: 'processing', progress: 0 })),
  on(GifActions.updateProgress, (s, { progress }) => ({ ...s, progress })),
  on(GifActions.processingSuccess, (s, { outputBlob }) => ({ ...s, status: 'success', outputBlob, progress: 100 })),
  on(GifActions.processingFailure, (s) => ({ ...s, status: 'error' })),
  on(GifActions.resetState, () => initialState),
)});

const GIF_WIDTHS = [240, 320, 480, 640];
const GIF_FPS_OPTIONS = [5, 10, 15, 20, 24];

@Component({
  selector: 'app-video-to-gif',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-pink-400 to-fuchsia-400 bg-clip-text text-transparent pb-1">Video → GIF</h2>
        <p class="text-gray-400 text-sm mt-1">Convert any video segment to optimized GIF with FFmpeg palette generation for best quality.</p>
      </div>

      @if (vm$ | async; as vm) {
        @if (!vm.inputFile) {
          <div class="flex-1 flex flex-col justify-center">
            <app-file-drop-zone accept="video/*" (fileDropped)="onFile($event)"></app-file-drop-zone>
          </div>
        } @else {
          <div class="flex flex-col lg:flex-row gap-6">
            <div class="flex-1 flex flex-col gap-4">
              <app-video-preview [videoUrl]="videoUrl" (durationLoaded)="videoDuration = $event"></app-video-preview>
              @if (vm.status === 'success' && vm.outputBlob) {
                <div class="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col items-center">
                  <img [src]="gifPreviewUrl" alt="GIF Preview" class="max-w-full rounded-lg border border-gray-600">
                  <p class="text-xs text-gray-400 mt-2">{{ (vm.outputBlob.size / 1024).toFixed(0) }} KB</p>
                </div>
              }
            </div>
            <div class="w-full lg:w-72 flex flex-col gap-4">
              <!-- Start Time -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div class="flex justify-between mb-2"><label class="text-sm font-semibold text-gray-300">Start Time</label><span class="text-pink-400 font-mono">{{ vm.startTime }}s</span></div>
                <input type="range" min="0" [max]="videoDuration" [value]="vm.startTime" (input)="setStart($event)" class="w-full accent-pink-400">
              </div>
              <!-- Duration -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div class="flex justify-between mb-2"><label class="text-sm font-semibold text-gray-300">Duration</label><span class="text-pink-400 font-mono">{{ vm.duration }}s</span></div>
                <input type="range" min="1" max="30" [value]="vm.duration" (input)="setDur($event)" class="w-full accent-pink-400">
              </div>
              <!-- FPS -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <label class="block text-sm font-semibold text-gray-300 mb-2">Frame Rate</label>
                <div class="flex gap-2">
                  @for (f of fpsOptions; track f) {
                    <button (click)="setFps(f)"
                      [class]="vm.fps === f ? 'bg-pink-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
                      class="flex-1 py-2 rounded-lg text-xs font-mono transition-all">{{ f }}fps</button>
                  }
                </div>
              </div>
              <!-- Width -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <label class="block text-sm font-semibold text-gray-300 mb-2">Width</label>
                <div class="grid grid-cols-2 gap-2">
                  @for (w of gifWidths; track w) {
                    <button (click)="setWidth(w)"
                      [class]="vm.width === w ? 'bg-pink-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
                      class="py-2 rounded-lg text-sm font-mono transition-all">{{ w }}px</button>
                  }
                </div>
              </div>
              <!-- Loop toggle -->
              <button (click)="toggleLoop()" [class]="vm.loop ? 'bg-fuchsia-700 border-fuchsia-600' : 'bg-gray-800 border-gray-700'" class="border px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 text-white">
                🔁 {{ vm.loop ? 'Looping GIF' : 'No Loop' }}
              </button>
              <!-- FFmpeg preview -->
              <div class="bg-gray-950 rounded-xl p-3 font-mono text-xs text-pink-300 break-all">
                -ss {{ vm.startTime }} -t {{ vm.duration }} -vf "fps={{ vm.fps }},scale={{ vm.width }}:-1:flags=lanczos,palettegen/paletteuse" -loop {{ vm.loop ? '0' : '1' }}
              </div>

              @if (vm.status === 'processing') {
                <div class="bg-gray-800 rounded-xl p-6 flex flex-col items-center"><app-progress-ring [progress]="vm.progress" [status]="'Creating GIF...'"></app-progress-ring></div>
              } @else if (vm.status === 'success') {
                <button (click)="onDownload(vm)" class="w-full bg-pink-600 hover:bg-pink-500 text-white py-3 rounded-xl font-bold">⬇ Download GIF</button>
                <button (click)="onReset()" class="text-sm text-center text-gray-400 hover:text-white">Try Another</button>
              } @else {
                <button (click)="onProcess(vm)" class="w-full bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all active:scale-95">
                  🎞 Create GIF
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
export class VideoToGifComponent {
  private store = inject(Store);
  private workerBridge = inject(WorkerBridgeService);
  readonly vm$ = this.store.select(gifFeature.selectVideoToGifState);
  videoUrl: string | null = null;
  gifPreviewUrl: string | null = null;
  videoDuration = 60;
  readonly fpsOptions = GIF_FPS_OPTIONS;
  readonly gifWidths = GIF_WIDTHS;

  setStart(e: Event): void { this.store.dispatch(GifActions.setStartTime({ startTime: +(e.target as HTMLInputElement).value })); }
  setDur(e: Event): void { this.store.dispatch(GifActions.setDuration({ duration: +(e.target as HTMLInputElement).value })); }
  setFps(fps: number): void { this.store.dispatch(GifActions.setFps({ fps })); }
  setWidth(width: number): void { this.store.dispatch(GifActions.setWidth({ width })); }
  toggleLoop(): void { this.store.dispatch(GifActions.toggleLoop()); }

  onFile(file: File): void { if (this.videoUrl) URL.revokeObjectURL(this.videoUrl); this.videoUrl = URL.createObjectURL(file); this.store.dispatch(GifActions.loadFile({ file })); }

  onProcess(state: GifState): void {
    this.store.dispatch(GifActions.startProcessing());
    if (state.inputFile) {
      const worker = new Worker(new URL('./video-to-gif.worker', import.meta.url), { type: 'module' });
      this.workerBridge.runTask(worker, state).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') this.store.dispatch(GifActions.updateProgress({ progress: msg.value }));
          else if (msg.type === 'complete') {
            const blob = new Blob([msg.data as BlobPart ?? new ArrayBuffer(0)], { type: 'image/gif' });
            this.gifPreviewUrl = URL.createObjectURL(blob);
            this.store.dispatch(GifActions.processingSuccess({ outputBlob: blob }));
          }
        },
        error: (err) => this.store.dispatch(GifActions.processingFailure({ message: err.message }))
      });
    }
  }

  onDownload(state: GifState): void {
    if (state.outputBlob) { const url = URL.createObjectURL(state.outputBlob); const a = Object.assign(document.createElement('a'), { href: url, download: 'omni_output.gif' }); document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 150); }
  }

  onReset(): void { if (this.videoUrl) { URL.revokeObjectURL(this.videoUrl); this.videoUrl = null; } if (this.gifPreviewUrl) { URL.revokeObjectURL(this.gifPreviewUrl); this.gifPreviewUrl = null; } this.store.dispatch(GifActions.resetState()); }
}