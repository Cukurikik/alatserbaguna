import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';

type BlurType = 'gaussblur'|'boxblur'|'smartblur'|'vignette';
interface BlurState { status: 'idle'|'processing'|'success'|'error'; progress: number; inputFile: File|null; outputBlob: Blob|null; blurType: BlurType; strength: number; }
const initialState: BlurState = { status: 'idle', progress: 0, inputFile: null, outputBlob: null, blurType: 'gaussblur', strength: 5 };

const BlurActions = createActionGroup({ source: 'Blur', events: {
  'Load File': props<{ file: File }>(),
  'Set Blur Type': props<{ blurType: BlurType }>(),
  'Set Strength': props<{ strength: number }>(),
  'Start Processing': emptyProps(),
  'Update Progress': props<{ progress: number }>(),
  'Processing Success': props<{ outputBlob: Blob }>(),
  'Processing Failure': props<{ message: string }>(),
  'Reset State': emptyProps(),
}});

const blurFeature = createFeature({ name: 'blur', reducer: createReducer(initialState,
  on(BlurActions.loadFile, (s, { file }) => ({ ...s, inputFile: file })),
  on(BlurActions.setBlurType, (s, { blurType }) => ({ ...s, blurType })),
  on(BlurActions.setStrength, (s, { strength }) => ({ ...s, strength })),
  on(BlurActions.startProcessing, (s) => ({ ...s, status: 'processing', progress: 0 })),
  on(BlurActions.updateProgress, (s, { progress }) => ({ ...s, progress })),
  on(BlurActions.processingSuccess, (s, { outputBlob }) => ({ ...s, status: 'success', outputBlob, progress: 100 })),
  on(BlurActions.processingFailure, (s) => ({ ...s, status: 'error' })),
  on(BlurActions.resetState, () => initialState),
)});

const BLUR_TYPES: { value: BlurType; label: string; desc: string; icon: string }[] = [
  { value: 'gaussblur', label: 'Gaussian Blur', desc: 'Standard Gaussian blur kernel', icon: '○' },
  { value: 'boxblur', label: 'Box Blur', desc: 'Fast box-averaging blur', icon: '□' },
  { value: 'smartblur', label: 'Smart Blur', desc: 'Edge-preserving smart blur', icon: '◎' },
  { value: 'vignette', label: 'Vignette', desc: 'Dark border vignette effect', icon: '⬛' },
];

@Component({
  selector: 'app-blur',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-blue-300 to-purple-400 bg-clip-text text-transparent pb-1">Video Blur Effects</h2>
        <p class="text-gray-400 text-sm mt-1">Apply Gaussian, Box, Smart blur or Vignette effects using FFmpeg gblur/boxblur/smartblur filters.</p>
      </div>

      @if (vm$ | async; as vm) {
        @if (!vm.inputFile) {
          <div class="flex-1 flex flex-col justify-center">
            <app-file-drop-zone accept="video/*" (fileDropped)="onFile($event)"></app-file-drop-zone>
          </div>
        } @else {
          <div class="flex flex-col lg:flex-row gap-6">
            <div class="flex-1 flex flex-col gap-4">
              <div [style.filter]="getCssFilter(vm.blurType, vm.strength)" class="transition-all duration-300">
                <app-video-preview [videoUrl]="videoUrl"></app-video-preview>
              </div>
              <!-- Live preview label -->
              <p class="text-xs text-gray-500 text-center">↑ CSS preview — actual FFmpeg output may differ slightly</p>
            </div>
            <div class="w-full lg:w-72 flex flex-col gap-4">
              <!-- Blur Type -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <label class="block text-sm font-semibold text-gray-300 mb-2">Blur Type</label>
                @for (bt of blurTypes; track bt.value) {
                  <button (click)="setType(bt.value)"
                    [class]="vm.blurType === bt.value ? 'bg-blue-700 border-blue-500' : 'border-gray-700 hover:border-gray-500'"
                    class="w-full mb-2 text-left p-3 rounded-lg border transition-all flex items-center gap-3">
                    <span class="text-blue-400 text-lg">{{ bt.icon }}</span>
                    <div>
                      <div class="text-white text-sm font-medium">{{ bt.label }}</div>
                      <div class="text-xs text-gray-400">{{ bt.desc }}</div>
                    </div>
                  </button>
                }
              </div>
              <!-- Strength -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div class="flex justify-between mb-2"><label class="text-sm font-semibold text-gray-300">Strength</label><span class="text-blue-400 font-mono">{{ vm.strength }}</span></div>
                <input type="range" min="1" max="20" [value]="vm.strength" (input)="setStrength($event)" class="w-full accent-blue-400">
              </div>
              <!-- FFmpeg filter -->
              <div class="bg-gray-950 rounded-xl p-3 font-mono text-xs text-blue-300 break-all">
                @if (vm.blurType === 'gaussblur') { -vf gblur=sigma={{ vm.strength }} }
                @if (vm.blurType === 'boxblur') { -vf boxblur={{ vm.strength }}:{{ vm.strength }} }
                @if (vm.blurType === 'smartblur') { -vf smartblur={{ vm.strength }}:1:-{{ vm.strength }}:0.25 }
                @if (vm.blurType === 'vignette') { -vf vignette=PI/{{ 8 - Math.floor(vm.strength / 3) }} }
              </div>

              @if (vm.status === 'processing') {
                <div class="bg-gray-800 rounded-xl p-6 flex flex-col items-center"><app-progress-ring [progress]="vm.progress" [status]="'Applying blur...'"></app-progress-ring></div>
              } @else if (vm.status === 'success') {
                <button (click)="onDownload(vm)" class="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold">⬇ Download Blurred Video</button>
                <button (click)="onReset()" class="text-sm text-center text-gray-400 hover:text-white">Try Another</button>
              } @else {
                <button (click)="onProcess(vm)" class="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all active:scale-95">
                  Apply Blur
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
export class BlurComponent {
  private store = inject(Store);
  private workerBridge = inject(WorkerBridgeService);
  readonly vm$ = this.store.select(blurFeature.selectBlurState);
  videoUrl: string | null = null;
  readonly blurTypes = BLUR_TYPES;
  readonly Math = Math;

  getCssFilter(type: BlurType, strength: number): string {
    if (type === 'vignette') return 'none';
    return `blur(${strength}px)`;
  }

  setType(blurType: BlurType): void { this.store.dispatch(BlurActions.setBlurType({ blurType })); }
  setStrength(e: Event): void { this.store.dispatch(BlurActions.setStrength({ strength: +(e.target as HTMLInputElement).value })); }
  onFile(file: File): void { if (this.videoUrl) URL.revokeObjectURL(this.videoUrl); this.videoUrl = URL.createObjectURL(file); this.store.dispatch(BlurActions.loadFile({ file })); }

  onProcess(state: BlurState): void {
    this.store.dispatch(BlurActions.startProcessing());
    if (state.inputFile) {
      const worker = new Worker(new URL('./blur.worker', import.meta.url), { type: 'module' });
      this.workerBridge.runTask(worker, { file: state.inputFile, blurType: state.blurType, strength: state.strength }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') this.store.dispatch(BlurActions.updateProgress({ progress: msg.value }));
          else if (msg.type === 'complete') this.store.dispatch(BlurActions.processingSuccess({ outputBlob: new Blob([msg.data as BlobPart ?? new ArrayBuffer(0)], { type: 'video/mp4' }) }));
        },
        error: (err) => this.store.dispatch(BlurActions.processingFailure({ message: err.message }))
      });
    }
  }

  onDownload(state: BlurState): void {
    if (state.outputBlob) { const url = URL.createObjectURL(state.outputBlob); const a = Object.assign(document.createElement('a'), { href: url, download: 'omni_blur.mp4' }); document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 150); }
  }

  onReset(): void { if (this.videoUrl) { URL.revokeObjectURL(this.videoUrl); this.videoUrl = null; } this.store.dispatch(BlurActions.resetState()); }
}