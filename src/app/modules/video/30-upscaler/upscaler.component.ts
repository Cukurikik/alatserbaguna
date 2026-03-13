import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';

type UpscaleModel = 'esrgan'|'swinir-lite'|'anime4k';
type UpscaleFactor = 2|3|4;
interface UpscalerState { status: 'idle'|'loading-model'|'processing'|'success'|'error'; progress: number; inputFile: File|null; outputBlob: Blob|null; model: UpscaleModel; factor: UpscaleFactor; }
const initialState: UpscalerState = { status: 'idle', progress: 0, inputFile: null, outputBlob: null, model: 'esrgan', factor: 2 };

const UpscalerActions = createActionGroup({ source: 'Upscaler', events: {
  'Load File': props<{ file: File }>(),
  'Set Model': props<{ model: UpscaleModel }>(),
  'Set Factor': props<{ factor: UpscaleFactor }>(),
  'Start Processing': emptyProps(),
  'Update Progress': props<{ progress: number }>(),
  'Processing Success': props<{ outputBlob: Blob }>(),
  'Processing Failure': props<{ message: string }>(),
  'Reset State': emptyProps(),
}});

const upscalerFeature = createFeature({ name: 'upscaler', reducer: createReducer(initialState,
  on(UpscalerActions.loadFile, (s, { file }) => ({ ...s, inputFile: file })),
  on(UpscalerActions.setModel, (s, { model }) => ({ ...s, model })),
  on(UpscalerActions.setFactor, (s, { factor }) => ({ ...s, factor })),
  on(UpscalerActions.startProcessing, (s) => ({ ...s, status: 'processing', progress: 0 })),
  on(UpscalerActions.updateProgress, (s, { progress }) => ({ ...s, progress })),
  on(UpscalerActions.processingSuccess, (s, { outputBlob }) => ({ ...s, status: 'success', outputBlob, progress: 100 })),
  on(UpscalerActions.processingFailure, (s) => ({ ...s, status: 'error' })),
  on(UpscalerActions.resetState, () => initialState),
)});

const MODELS: { value: UpscaleModel; label: string; desc: string; badge: string }[] = [
  { value: 'esrgan', label: 'ESRGAN', desc: 'Photo-realistic Real-ESRGAN model', badge: 'Recommended' },
  { value: 'swinir-lite', label: 'SwinIR-Lite', desc: 'Efficient Swin transformer upscaler', badge: 'Fast' },
  { value: 'anime4k', label: 'Anime4K', desc: 'Optimized for anime/cartoon content', badge: 'Anime' },
];
const FACTORS: UpscaleFactor[] = [2, 3, 4];

@Component({
  selector: 'app-upscaler',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-fuchsia-400 to-violet-400 bg-clip-text text-transparent pb-1">AI Video Upscaler</h2>
        <p class="text-gray-400 text-sm mt-1">Enhance video resolution up to 4× using TensorFlow.js ESRGAN / SwinIR / Anime4K models with WebGPU acceleration.</p>
      </div>

      @if (vm$ | async; as vm) {
        @if (!vm.inputFile) {
          <div class="flex-1 flex flex-col justify-center">
            <app-file-drop-zone accept="video/*" (fileDropped)="onFile($event)"></app-file-drop-zone>
            <!-- AI Badge -->
            <div class="mt-6 flex flex-wrap gap-2 justify-center">
              <span class="bg-fuchsia-900/30 border border-fuchsia-700 text-fuchsia-300 text-xs px-3 py-1 rounded-full">⚡ WebGPU Accelerated</span>
              <span class="bg-violet-900/30 border border-violet-700 text-violet-300 text-xs px-3 py-1 rounded-full">🧠 TensorFlow.js</span>
              <span class="bg-indigo-900/30 border border-indigo-700 text-indigo-300 text-xs px-3 py-1 rounded-full">🎨 Frame-by-Frame AI</span>
            </div>
          </div>
        } @else {
          <div class="flex flex-col lg:flex-row gap-6">
            <div class="flex-1 flex flex-col gap-4">
              <app-video-preview [videoUrl]="videoUrl"></app-video-preview>
              <!-- Resolution estimation -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Current</p>
                  <p class="text-white font-mono font-bold">{{ width }}×{{ height }}</p>
                </div>
                <div class="text-gray-500 text-2xl">→</div>
                <div class="text-right">
                  <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">After ×{{ vm.factor }}</p>
                  <p class="text-fuchsia-400 font-mono font-bold">{{ width * vm.factor }}×{{ height * vm.factor }}</p>
                </div>
              </div>
            </div>

            <div class="w-full lg:w-80 flex flex-col gap-4">
              <!-- Model Selection -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <label class="block text-sm font-semibold text-gray-300 mb-3">AI Model</label>
                @for (m of models; track m.value) {
                  <button (click)="setModel(m.value)"
                    [class]="vm.model === m.value ? 'bg-fuchsia-800 border-fuchsia-500' : 'border-gray-700 hover:border-gray-500'"
                    class="w-full mb-2 p-3 rounded-xl border transition-all text-left">
                    <div class="flex justify-between items-start">
                      <span class="text-white text-sm font-bold">{{ m.label }}</span>
                      <span class="text-xs bg-fuchsia-900 text-fuchsia-300 px-2 py-0.5 rounded-full">{{ m.badge }}</span>
                    </div>
                    <p class="text-xs text-gray-400 mt-1">{{ m.desc }}</p>
                  </button>
                }
              </div>
              <!-- Scale Factor -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <label class="block text-sm font-semibold text-gray-300 mb-3">Scale Factor</label>
                <div class="flex gap-3">
                  @for (f of factors; track f) {
                    <button (click)="setFactor(f)"
                      [class]="vm.factor === f ? 'bg-fuchsia-600 text-white shadow-[0_0_10px_rgba(217,70,239,0.5)]' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
                      class="flex-1 py-3 rounded-xl text-xl font-bold font-mono transition-all">×{{ f }}</button>
                  }
                </div>
              </div>
              <!-- Warning for 4x -->
              @if (vm.factor === 4) {
                <div class="bg-yellow-900/20 border border-yellow-700 rounded-xl p-3 flex gap-3">
                  <span class="text-yellow-400 flex-shrink-0">⚠</span>
                  <p class="text-xs text-yellow-300">4× upscaling is very processing-intensive and may take several minutes even with WebGPU.</p>
                </div>
              }

              @if (vm.status === 'processing') {
                <div class="bg-gray-800 rounded-xl p-6 flex flex-col items-center gap-3">
                  <app-progress-ring [progress]="vm.progress" [status]="'Enhancing frames...'"></app-progress-ring>
                  <p class="text-xs text-gray-400">AI processing {{ vm.progress.toFixed(0) }}% complete</p>
                </div>
              } @else if (vm.status === 'success') {
                <button (click)="onDownload(vm)" class="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white py-3 rounded-xl font-bold">⬇ Download Enhanced Video</button>
                <button (click)="onReset()" class="text-sm text-center text-gray-400 hover:text-white">Try Another</button>
              } @else {
                <button (click)="onProcess(vm)" class="w-full bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.5)] transition-all active:scale-95">
                  🚀 Upscale with AI
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
export class UpscalerComponent {
  private store = inject(Store);
  private workerBridge = inject(WorkerBridgeService);
  readonly vm$ = this.store.select(upscalerFeature.selectUpscalerState);
  videoUrl: string | null = null;
  width = 1920;
  height = 1080;
  readonly models = MODELS;
  readonly factors = FACTORS;

  setModel(model: UpscaleModel): void { this.store.dispatch(UpscalerActions.setModel({ model })); }
  setFactor(factor: UpscaleFactor): void { this.store.dispatch(UpscalerActions.setFactor({ factor })); }

  onFile(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = this.videoUrl;
    video.onloadedmetadata = () => { this.width = video.videoWidth; this.height = video.videoHeight; };
    this.store.dispatch(UpscalerActions.loadFile({ file }));
  }

  onProcess(state: UpscalerState): void {
    this.store.dispatch(UpscalerActions.startProcessing());
    if (state.inputFile) {
      const worker = new Worker(new URL('./upscaler.worker', import.meta.url), { type: 'module' });
      this.workerBridge.runTask(worker, { file: state.inputFile, model: state.model, factor: state.factor }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') this.store.dispatch(UpscalerActions.updateProgress({ progress: msg.value }));
          else if (msg.type === 'complete') this.store.dispatch(UpscalerActions.processingSuccess({ outputBlob: new Blob([msg.data as BlobPart ?? new ArrayBuffer(0)], { type: 'video/mp4' }) }));
        },
        error: (err) => this.store.dispatch(UpscalerActions.processingFailure({ message: err.message }))
      });
    }
  }

  onDownload(state: UpscalerState): void {
    if (state.outputBlob) { const url = URL.createObjectURL(state.outputBlob); const a = Object.assign(document.createElement('a'), { href: url, download: `omni_upscaled_${state.factor}x.mp4` }); document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 150); }
  }

  onReset(): void { if (this.videoUrl) { URL.revokeObjectURL(this.videoUrl); this.videoUrl = null; } this.store.dispatch(UpscalerActions.resetState()); }
}