import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';

interface SlideshowState { status: 'idle'|'processing'|'success'|'error'; progress: number; images: File[]; outputBlob: Blob|null; duration: number; fps: number; transition: 'fade'|'none'; width: number; height: number; }
const initialState: SlideshowState = { status: 'idle', progress: 0, images: [], outputBlob: null, duration: 3, fps: 25, transition: 'fade', width: 1920, height: 1080 };

const SlideshowActions = createActionGroup({ source: 'Slideshow', events: {
  'Add Images': props<{ files: File[] }>(),
  'Remove Image': props<{ index: number }>(),
  'Set Duration': props<{ duration: number }>(),
  'Set Fps': props<{ fps: number }>(),
  'Set Transition': props<{ transition: 'fade'|'none' }>(),
  'Start Processing': emptyProps(),
  'Update Progress': props<{ progress: number }>(),
  'Processing Success': props<{ outputBlob: Blob }>(),
  'Processing Failure': props<{ message: string }>(),
  'Reset State': emptyProps(),
}});

const slideshowFeature = createFeature({ name: 'slideshow', reducer: createReducer(initialState,
  on(SlideshowActions.addImages, (s, { files }) => ({ ...s, images: [...s.images, ...files] })),
  on(SlideshowActions.removeImage, (s, { index }) => ({ ...s, images: s.images.filter((_, i) => i !== index) })),
  on(SlideshowActions.setDuration, (s, { duration }) => ({ ...s, duration })),
  on(SlideshowActions.setFps, (s, { fps }) => ({ ...s, fps })),
  on(SlideshowActions.setTransition, (s, { transition }) => ({ ...s, transition })),
  on(SlideshowActions.startProcessing, (s) => ({ ...s, status: 'processing', progress: 0 })),
  on(SlideshowActions.updateProgress, (s, { progress }) => ({ ...s, progress })),
  on(SlideshowActions.processingSuccess, (s, { outputBlob }) => ({ ...s, status: 'success', outputBlob, progress: 100 })),
  on(SlideshowActions.processingFailure, (s) => ({ ...s, status: 'error' })),
  on(SlideshowActions.resetState, () => initialState),
)});

@Component({
  selector: 'app-slideshow',
  standalone: true,
  imports: [AsyncPipe, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-lime-400 to-green-400 bg-clip-text text-transparent pb-1">Image Slideshow</h2>
        <p class="text-gray-400 text-sm mt-1">Convert images to a video slideshow using FFmpeg concat demuxer with optional fade transitions.</p>
      </div>

      @if (vm$ | async; as vm) {
        <div class="flex flex-col lg:flex-row gap-6">
          <div class="flex-1 flex flex-col gap-4">
            <!-- Image Drop -->
            <label class="border-2 border-dashed border-gray-600 hover:border-lime-400 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all">
              <div class="w-14 h-14 rounded-full bg-lime-900/30 flex items-center justify-center">
                <svg class="w-7 h-7 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              <p class="text-gray-300">Click or drag images here</p>
              <p class="text-xs text-gray-500">PNG, JPG, WEBP supported</p>
              <input type="file" accept="image/*" multiple class="hidden" (change)="onImagesAdded($event)">
            </label>
            <!-- Image Grid -->
            @if (vm.images.length > 0) {
              <div class="grid grid-cols-4 gap-2">
                @for (img of vm.images; track img.name; let i = $index) {
                  <div class="relative group">
                    <img [src]="getObjectUrl(img)" class="w-full aspect-video object-cover rounded-lg border border-gray-700">
                    <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                      <button (click)="removeImage(i)" class="text-white text-lg hover:text-red-400">✕</button>
                    </div>
                    <div class="absolute bottom-1 left-1 bg-black/70 text-xs text-white px-1 rounded">{{ i + 1 }}</div>
                  </div>
                }
              </div>
            }
          </div>
          <div class="w-full lg:w-72 flex flex-col gap-4">
            <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div class="flex justify-between mb-2"><label class="text-sm font-semibold text-gray-300">Duration per Image</label><span class="text-lime-400 font-mono">{{ vm.duration }}s</span></div>
              <input type="range" min="1" max="10" [value]="vm.duration" (input)="setDuration($event)" class="w-full accent-lime-400">
            </div>
            <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <label class="block text-sm font-semibold text-gray-300 mb-2">Transition</label>
              <div class="flex gap-2">
                <button (click)="setTransition('fade')" [class]="vm.transition === 'fade' ? 'bg-lime-600 text-white' : 'bg-gray-700 text-gray-300'" class="flex-1 py-2 rounded-lg text-sm transition-all">🌅 Fade</button>
                <button (click)="setTransition('none')" [class]="vm.transition === 'none' ? 'bg-lime-600 text-white' : 'bg-gray-700 text-gray-300'" class="flex-1 py-2 rounded-lg text-sm transition-all">⚡ Cut</button>
              </div>
            </div>

            @if (vm.status === 'processing') {
              <div class="bg-gray-800 rounded-xl p-6 flex flex-col items-center"><app-progress-ring [progress]="vm.progress" [status]="'Building slideshow...'"></app-progress-ring></div>
            } @else if (vm.status === 'success') {
              <button (click)="onDownload(vm)" class="w-full bg-lime-600 hover:bg-lime-500 text-gray-900 font-bold py-3 rounded-xl">⬇ Download Slideshow</button>
              <button (click)="onReset()" class="text-sm text-center text-gray-400 hover:text-white">Start New</button>
            } @else {
              <button (click)="onProcess(vm)" [disabled]="vm.images.length === 0"
                class="w-full bg-gradient-to-r from-lime-500 to-green-500 text-gray-900 font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(132,204,22,0.4)] transition-all active:scale-95 disabled:opacity-50">
                🖼 Create Slideshow ({{ vm.images.length }} images)
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SlideshowComponent {
  private store = inject(Store);
  private workerBridge = inject(WorkerBridgeService);
  readonly vm$ = this.store.select(slideshowFeature.selectSlideshowState);
  private objUrls = new Map<string, string>();

  getObjectUrl(file: File): string {
    if (!this.objUrls.has(file.name)) this.objUrls.set(file.name, URL.createObjectURL(file));
    return this.objUrls.get(file.name)!;
  }

  onImagesAdded(e: Event): void { const files = Array.from((e.target as HTMLInputElement).files ?? []); if (files.length) this.store.dispatch(SlideshowActions.addImages({ files })); }
  removeImage(index: number): void { this.store.dispatch(SlideshowActions.removeImage({ index })); }
  setDuration(e: Event): void { this.store.dispatch(SlideshowActions.setDuration({ duration: +(e.target as HTMLInputElement).value })); }
  setTransition(transition: 'fade'|'none'): void { this.store.dispatch(SlideshowActions.setTransition({ transition })); }

  onProcess(state: SlideshowState): void {
    this.store.dispatch(SlideshowActions.startProcessing());
    if (state.images.length > 0) {
      const worker = new Worker(new URL('./slideshow.worker', import.meta.url), { type: 'module' });
      this.workerBridge.runTask(worker, { images: state.images, duration: state.duration, fps: state.fps, transition: state.transition }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') this.store.dispatch(SlideshowActions.updateProgress({ progress: msg.value }));
          else if (msg.type === 'complete') this.store.dispatch(SlideshowActions.processingSuccess({ outputBlob: new Blob([msg.data as BlobPart ?? new ArrayBuffer(0)], { type: 'video/mp4' }) }));
        },
        error: (err) => this.store.dispatch(SlideshowActions.processingFailure({ message: err.message }))
      });
    }
  }

  onDownload(state: SlideshowState): void {
    if (state.outputBlob) { const url = URL.createObjectURL(state.outputBlob); const a = Object.assign(document.createElement('a'), { href: url, download: 'omni_slideshow.mp4' }); document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 150); }
  }

  onReset(): void { this.objUrls.forEach(url => URL.revokeObjectURL(url)); this.objUrls.clear(); this.store.dispatch(SlideshowActions.resetState()); }
}