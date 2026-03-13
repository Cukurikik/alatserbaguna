import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';

type DenoiseAlgo = 'hqdn3d' | 'nlmeans' | 'atadenoise';
interface DenoiserState { status: 'idle'|'processing'|'success'|'error'; progress: number; inputFile: File|null; outputBlob: Blob|null; algorithm: DenoiseAlgo; strength: number; }
const initialState: DenoiserState = { status: 'idle', progress: 0, inputFile: null, outputBlob: null, algorithm: 'hqdn3d', strength: 3 };

const DenoiserActions = createActionGroup({ source: 'Denoiser', events: {
  'Load File': props<{ file: File }>(),
  'Set Algorithm': props<{ algorithm: DenoiseAlgo }>(),
  'Set Strength': props<{ strength: number }>(),
  'Start Processing': emptyProps(),
  'Update Progress': props<{ progress: number }>(),
  'Processing Success': props<{ outputBlob: Blob }>(),
  'Processing Failure': props<{ message: string }>(),
  'Reset State': emptyProps(),
}});

const denoiserFeature = createFeature({ name: 'denoiser', reducer: createReducer(initialState,
  on(DenoiserActions.loadFile, (s, { file }) => ({ ...s, inputFile: file })),
  on(DenoiserActions.setAlgorithm, (s, { algorithm }) => ({ ...s, algorithm })),
  on(DenoiserActions.setStrength, (s, { strength }) => ({ ...s, strength })),
  on(DenoiserActions.startProcessing, (s) => ({ ...s, status: 'processing', progress: 0 })),
  on(DenoiserActions.updateProgress, (s, { progress }) => ({ ...s, progress })),
  on(DenoiserActions.processingSuccess, (s, { outputBlob }) => ({ ...s, status: 'success', outputBlob, progress: 100 })),
  on(DenoiserActions.processingFailure, (s) => ({ ...s, status: 'error' })),
  on(DenoiserActions.resetState, () => initialState),
)});

const ALGORITHMS: { value: DenoiseAlgo; label: string; desc: string }[] = [
  { value: 'hqdn3d', label: 'hqdn3d', desc: 'Fast 3D denoising (recommended)' },
  { value: 'nlmeans', label: 'NL-Means', desc: 'High quality, slower processing' },
  { value: 'atadenoise', label: 'AtaDenoise', desc: 'Adaptive temporal averaging' },
];

@Component({
  selector: 'app-denoiser',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-slate-300 to-gray-400 bg-clip-text text-transparent pb-1">Video Denoiser</h2>
        <p class="text-gray-400 text-sm mt-1">Remove grain, noise and artifacts using FFmpeg hqdn3d / NL-Means / AtaDenoise filters.</p>
      </div>

      @if (vm$ | async; as vm) {
        @if (!vm.inputFile) {
          <div class="flex-1 flex flex-col justify-center">
            <app-file-drop-zone accept="video/*" (fileDropped)="onFile($event)"></app-file-drop-zone>
          </div>
        } @else {
          <div class="flex flex-col lg:flex-row gap-6">
            <div class="flex-1"><app-video-preview [videoUrl]="videoUrl"></app-video-preview></div>
            <div class="w-full lg:w-80 flex flex-col gap-4">
              <!-- Algorithm Selection -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <label class="block text-sm font-semibold text-gray-300 mb-3">Denoise Algorithm</label>
                @for (algo of algorithms; track algo.value) {
                  <button (click)="setAlgo(algo.value)"
                    [class]="vm.algorithm === algo.value ? 'bg-gray-600 border-gray-400' : 'border-gray-700 hover:border-gray-500'"
                    class="w-full mb-2 text-left p-3 rounded-lg border transition-all">
                    <div class="font-mono text-sm text-white">{{ algo.label }}</div>
                    <div class="text-xs text-gray-400">{{ algo.desc }}</div>
                  </button>
                }
              </div>
              <!-- Strength -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div class="flex justify-between mb-2">
                  <label class="text-sm font-semibold text-gray-300">Strength</label>
                  <span class="text-gray-300 font-mono font-bold">{{ vm.strength }}</span>
                </div>
                <input type="range" min="1" max="10" [value]="vm.strength" (input)="setStrength($event)" class="w-full accent-gray-400">
                <div class="flex justify-between text-xs text-gray-500 mt-1"><span>Subtle</span><span>Heavy</span></div>
              </div>
              <!-- Filter preview -->
              <div class="bg-gray-950 rounded-xl p-3 border border-gray-700 font-mono text-xs text-gray-300">
                @if (vm.algorithm === 'hqdn3d') { -vf hqdn3d={{ vm.strength }}:{{ vm.strength }}:{{ vm.strength * 2 }}:{{ vm.strength * 2 }} }
                @if (vm.algorithm === 'nlmeans') { -vf nlmeans=s={{ vm.strength }}:p=7:r=15 }
                @if (vm.algorithm === 'atadenoise') { -vf atadenoise=s={{ vm.strength / 10 }}:p=1 }
              </div>

              @if (vm.status === 'processing') {
                <div class="bg-gray-800 rounded-xl p-6 flex flex-col items-center"><app-progress-ring [progress]="vm.progress" [status]="'Denoising...'"></app-progress-ring></div>
              } @else if (vm.status === 'success') {
                <button (click)="onDownload(vm)" class="w-full bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-xl font-bold">Download Denoised</button>
                <button (click)="onReset()" class="text-sm text-center text-gray-400 hover:text-white">Try Another</button>
              } @else {
                <button (click)="onProcess(vm)" class="w-full bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-500 hover:to-slate-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95">
                  🔇 Remove Noise
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
export class DenoiserComponent {
  private store = inject(Store);
  private workerBridge = inject(WorkerBridgeService);
  readonly vm$ = this.store.select(denoiserFeature.selectDenoiserState);
  videoUrl: string | null = null;
  readonly algorithms = ALGORITHMS;

  setAlgo(algorithm: DenoiseAlgo): void { this.store.dispatch(DenoiserActions.setAlgorithm({ algorithm })); }
  setStrength(e: Event): void { this.store.dispatch(DenoiserActions.setStrength({ strength: +(e.target as HTMLInputElement).value })); }

  onFile(file: File): void { if (this.videoUrl) URL.revokeObjectURL(this.videoUrl); this.videoUrl = URL.createObjectURL(file); this.store.dispatch(DenoiserActions.loadFile({ file })); }

  onProcess(state: DenoiserState): void {
    this.store.dispatch(DenoiserActions.startProcessing());
    if (state.inputFile) {
      const worker = new Worker(new URL('./denoiser.worker', import.meta.url), { type: 'module' });
      this.workerBridge.runTask(worker, { file: state.inputFile, algorithm: state.algorithm, strength: state.strength }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') this.store.dispatch(DenoiserActions.updateProgress({ progress: msg.value }));
          else if (msg.type === 'complete') this.store.dispatch(DenoiserActions.processingSuccess({ outputBlob: new Blob([msg.data as BlobPart], { type: 'video/mp4' }) }));
        },
        error: (err) => this.store.dispatch(DenoiserActions.processingFailure({ message: err.message }))
      });
    }
  }

  onDownload(state: DenoiserState): void {
    if (state.outputBlob) { const url = URL.createObjectURL(state.outputBlob); const a = Object.assign(document.createElement('a'), { href: url, download: 'omni_denoised.mp4' }); document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 150); }
  }

  onReset(): void { if (this.videoUrl) { URL.revokeObjectURL(this.videoUrl); this.videoUrl = null; } this.store.dispatch(DenoiserActions.resetState()); }
}