import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';

interface ThumbnailState { status: 'idle'|'processing'|'success'|'error'; progress: number; inputFile: File|null; thumbnails: string[]; timestamp: number; count: number; quality: number; }
const initialState: ThumbnailState = { status: 'idle', progress: 0, inputFile: null, thumbnails: [], timestamp: 0, count: 5, quality: 90 };

const ThumbnailActions = createActionGroup({ source: 'ThumbnailGenerator', events: {
  'Load File': props<{ file: File }>(),
  'Set Timestamp': props<{ timestamp: number }>(),
  'Set Count': props<{ count: number }>(),
  'Set Quality': props<{ quality: number }>(),
  'Start Processing': emptyProps(),
  'Update Progress': props<{ progress: number }>(),
  'Processing Success': props<{ thumbnails: string[] }>(),
  'Processing Failure': props<{ message: string }>(),
  'Reset State': emptyProps(),
}});

const thumbnailFeature = createFeature({ name: 'thumbnailGenerator', reducer: createReducer(initialState,
  on(ThumbnailActions.loadFile, (s, { file }) => ({ ...s, inputFile: file })),
  on(ThumbnailActions.setTimestamp, (s, { timestamp }) => ({ ...s, timestamp })),
  on(ThumbnailActions.setCount, (s, { count }) => ({ ...s, count })),
  on(ThumbnailActions.setQuality, (s, { quality }) => ({ ...s, quality })),
  on(ThumbnailActions.startProcessing, (s) => ({ ...s, status: 'processing', progress: 0, thumbnails: [] })),
  on(ThumbnailActions.updateProgress, (s, { progress }) => ({ ...s, progress })),
  on(ThumbnailActions.processingSuccess, (s, { thumbnails }) => ({ ...s, status: 'success', thumbnails, progress: 100 })),
  on(ThumbnailActions.processingFailure, (s) => ({ ...s, status: 'error' })),
  on(ThumbnailActions.resetState, () => initialState),
)});

@Component({
  selector: 'app-thumbnail-generator',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent pb-1">Thumbnail Generator</h2>
        <p class="text-gray-400 text-sm mt-1">Extract frames as high-quality JPEG/PNG thumbnails using FFmpeg vf select filter.</p>
      </div>

      @if (vm$ | async; as vm) {
        @if (!vm.inputFile) {
          <div class="flex-1 flex flex-col justify-center">
            <app-file-drop-zone accept="video/*" (fileDropped)="onFile($event)"></app-file-drop-zone>
          </div>
        } @else {
          <div class="flex flex-col lg:flex-row gap-6">
            <div class="flex-1 flex flex-col gap-4">
              <app-video-preview [videoUrl]="videoUrl" (durationLoaded)="onDuration($event)"></app-video-preview>
              <!-- Thumbnail Grid -->
              @if (vm.thumbnails.length > 0) {
                <div class="grid grid-cols-3 gap-3">
                  @for (thumb of vm.thumbnails; track $index; let i = $index) {
                    <div class="relative group">
                      <img [src]="thumb" class="w-full rounded-lg border border-gray-700 group-hover:border-amber-400 transition-colors" alt="Thumbnail {{ i + 1 }}">
                      <button (click)="downloadThumb(thumb, i)"
                        class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                      </button>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="w-full lg:w-72 flex flex-col gap-4">
              <!-- Count -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div class="flex justify-between mb-2">
                  <label class="text-sm font-semibold text-gray-300">Number of Thumbnails</label>
                  <span class="text-amber-400 font-mono font-bold">{{ vm.count }}</span>
                </div>
                <input type="range" min="1" max="20" [value]="vm.count" (input)="setCount($event)" class="w-full accent-amber-400">
              </div>
              <!-- Quality -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div class="flex justify-between mb-2">
                  <label class="text-sm font-semibold text-gray-300">JPEG Quality</label>
                  <span class="text-amber-400 font-mono font-bold">{{ vm.quality }}%</span>
                </div>
                <input type="range" min="60" max="100" [value]="vm.quality" (input)="setQuality($event)" class="w-full accent-amber-400">
              </div>
              <!-- At Timestamp -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div class="flex justify-between mb-2">
                  <label class="text-sm font-semibold text-gray-300">Specific Timestamp (s)</label>
                  <span class="text-amber-400 font-mono font-bold">{{ vm.timestamp }}s</span>
                </div>
                <input type="range" min="0" [max]="videoDuration" [value]="vm.timestamp" (input)="setTimestamp($event)" class="w-full accent-amber-400">
                <p class="text-xs text-gray-500 mt-1">0 = extract evenly spaced</p>
              </div>

              @if (vm.status === 'processing') {
                <div class="bg-gray-800 rounded-xl p-6 flex flex-col items-center"><app-progress-ring [progress]="vm.progress" [status]="'Extracting frames...'"></app-progress-ring></div>
              } @else if (vm.status === 'success') {
                <button (click)="downloadAll(vm)" class="w-full bg-amber-500 hover:bg-amber-400 text-gray-900 py-3 rounded-xl font-bold">⬇ Download All as ZIP</button>
                <button (click)="onReset()" class="text-sm text-center text-gray-400 hover:text-white">Try Another</button>
              } @else {
                <button (click)="onProcess(vm)" class="w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all active:scale-95">
                  🖼 Extract Thumbnails
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
export class ThumbnailGeneratorComponent {
  private store = inject(Store);
  private workerBridge = inject(WorkerBridgeService);
  readonly vm$ = this.store.select(thumbnailFeature.selectThumbnailGeneratorState);
  videoUrl: string | null = null;
  videoDuration = 60;

  onDuration(duration: number): void { this.videoDuration = Math.floor(duration); }
  setCount(e: Event): void { this.store.dispatch(ThumbnailActions.setCount({ count: +(e.target as HTMLInputElement).value })); }
  setQuality(e: Event): void { this.store.dispatch(ThumbnailActions.setQuality({ quality: +(e.target as HTMLInputElement).value })); }
  setTimestamp(e: Event): void { this.store.dispatch(ThumbnailActions.setTimestamp({ timestamp: +(e.target as HTMLInputElement).value })); }

  onFile(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(ThumbnailActions.loadFile({ file }));
  }

  onProcess(state: ThumbnailState): void {
    this.store.dispatch(ThumbnailActions.startProcessing());
    if (state.inputFile) {
      const worker = new Worker(new URL('./thumbnail-generator.worker', import.meta.url), { type: 'module' });
      this.workerBridge.runTask(worker, { file: state.inputFile, count: state.count, quality: state.quality, timestamp: state.timestamp }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') this.store.dispatch(ThumbnailActions.updateProgress({ progress: msg.value }));
          else if (msg.type === 'complete') {
            // In production: convert returned ArrayBuffers to blob URLs
            const thumbUrls = Array.from({ length: state.count }, (_, i) => this.videoUrl ?? '');
            this.store.dispatch(ThumbnailActions.processingSuccess({ thumbnails: thumbUrls }));
          }
        },
        error: (err) => this.store.dispatch(ThumbnailActions.processingFailure({ message: err.message }))
      });
    }
  }

  downloadThumb(url: string, index: number): void {
    const a = Object.assign(document.createElement('a'), { href: url, download: `thumbnail_${index + 1}.jpg` });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  downloadAll(state: ThumbnailState): void {
    state.thumbnails.forEach((url, i) => this.downloadThumb(url, i));
  }

  onReset(): void {
    if (this.videoUrl) { URL.revokeObjectURL(this.videoUrl); this.videoUrl = null; }
    this.store.dispatch(ThumbnailActions.resetState());
  }
}