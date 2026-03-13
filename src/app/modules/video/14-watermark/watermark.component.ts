import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';

type WatermarkPos = 'top-left'|'top-right'|'bottom-left'|'bottom-right'|'center';
interface WatermarkState { status: 'idle'|'processing'|'success'|'error'; progress: number; inputFile: File|null; outputBlob: Blob|null; text: string; position: WatermarkPos; opacity: number; fontSize: number; fontColor: string; }
const initialState: WatermarkState = { status: 'idle', progress: 0, inputFile: null, outputBlob: null, text: 'Omni-Tool', position: 'bottom-right', opacity: 0.8, fontSize: 36, fontColor: 'white' };

const WatermarkActions = createActionGroup({ source: 'Watermark', events: {
  'Load File': props<{ file: File }>(),
  'Set Text': props<{ text: string }>(),
  'Set Position': props<{ position: WatermarkPos }>(),
  'Set Opacity': props<{ opacity: number }>(),
  'Set Font Size': props<{ fontSize: number }>(),
  'Set Font Color': props<{ fontColor: string }>(),
  'Start Processing': emptyProps(),
  'Update Progress': props<{ progress: number }>(),
  'Processing Success': props<{ outputBlob: Blob }>(),
  'Processing Failure': props<{ message: string }>(),
  'Reset State': emptyProps(),
}});

const watermarkFeature = createFeature({ name: 'watermark', reducer: createReducer(initialState,
  on(WatermarkActions.loadFile, (s, { file }) => ({ ...s, inputFile: file })),
  on(WatermarkActions.setText, (s, { text }) => ({ ...s, text })),
  on(WatermarkActions.setPosition, (s, { position }) => ({ ...s, position })),
  on(WatermarkActions.setOpacity, (s, { opacity }) => ({ ...s, opacity })),
  on(WatermarkActions.setFontSize, (s, { fontSize }) => ({ ...s, fontSize })),
  on(WatermarkActions.setFontColor, (s, { fontColor }) => ({ ...s, fontColor })),
  on(WatermarkActions.startProcessing, (s) => ({ ...s, status: 'processing', progress: 0 })),
  on(WatermarkActions.updateProgress, (s, { progress }) => ({ ...s, progress })),
  on(WatermarkActions.processingSuccess, (s, { outputBlob }) => ({ ...s, status: 'success', outputBlob, progress: 100 })),
  on(WatermarkActions.processingFailure, (s) => ({ ...s, status: 'error' })),
  on(WatermarkActions.resetState, () => initialState),
)});

const POSITIONS: { label: string; value: WatermarkPos }[] = [
  { label: '↖ Top Left', value: 'top-left' }, { label: '↗ Top Right', value: 'top-right' },
  { label: '↙ Bottom Left', value: 'bottom-left' }, { label: '↘ Bottom Right', value: 'bottom-right' },
  { label: '⊕ Center', value: 'center' },
];
const COLORS_WM = ['white', 'black', 'red', 'yellow', 'cyan', '#00ff88'];

function posToFFmpegXY(pos: WatermarkPos): string {
  switch (pos) {
    case 'top-left': return 'x=20:y=20';
    case 'top-right': return 'x=w-tw-20:y=20';
    case 'bottom-left': return 'x=20:y=h-th-20';
    case 'bottom-right': return 'x=w-tw-20:y=h-th-20';
    case 'center': return 'x=(w-tw)/2:y=(h-th)/2';
  }
}

@Component({
  selector: 'app-watermark',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent pb-1">Add Watermark</h2>
        <p class="text-gray-400 text-sm mt-1">Overlay text watermark at any position using FFmpeg drawtext filter.</p>
      </div>

      @if (vm$ | async; as vm) {
        @if (!vm.inputFile) {
          <div class="flex-1 flex flex-col justify-center">
            <app-file-drop-zone accept="video/*" (fileDropped)="onFile($event)"></app-file-drop-zone>
          </div>
        } @else {
          <div class="flex flex-col lg:flex-row gap-6">
            <div class="flex-1 flex flex-col gap-4">
              <!-- Live preview overlay -->
              <div class="relative">
                <app-video-preview [videoUrl]="videoUrl"></app-video-preview>
                <!-- Watermark preview overlay -->
                <div [class]="getPreviewClass(vm.position)"
                  [style.opacity]="vm.opacity"
                  [style.color]="vm.fontColor"
                  [style.fontSize.px]="vm.fontSize * 0.6"
                  class="absolute font-bold pointer-events-none select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {{ vm.text }}
                </div>
              </div>
              <!-- Filter preview -->
              <div class="bg-gray-950 rounded-xl p-3 font-mono text-xs text-violet-300 break-all">
                drawtext=text='{{ vm.text }}':{{ posToFFmpegXY(vm.position) }}:fontsize={{ vm.fontSize }}:fontcolor={{ vm.fontColor }}@{{ opacityHex(vm.opacity) }}
              </div>
            </div>

            <div class="w-full lg:w-80 flex flex-col gap-4">
              <!-- Text Input -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <label class="block text-sm font-semibold text-gray-300 mb-2">Watermark Text</label>
                <input type="text" [value]="vm.text" (input)="setText($event)"
                  class="w-full bg-gray-900 text-white border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-400 focus:outline-none"
                  placeholder="Your watermark text...">
              </div>
              <!-- Position Grid -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <label class="block text-sm font-semibold text-gray-300 mb-2">Position</label>
                <div class="grid grid-cols-2 gap-2">
                  @for (pos of positions; track pos.value) {
                    <button (click)="setPosition(pos.value)"
                      [class]="vm.position === pos.value ? 'bg-violet-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
                      class="py-2 px-3 rounded-lg text-xs transition-all">{{ pos.label }}</button>
                  }
                </div>
              </div>
              <!-- Opacity -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div class="flex justify-between mb-2">
                  <label class="text-sm font-semibold text-gray-300">Opacity</label>
                  <span class="text-violet-400 font-mono">{{ (vm.opacity * 100).toFixed(0) }}%</span>
                </div>
                <input type="range" min="0.1" max="1" step="0.01" [value]="vm.opacity" (input)="setOpacity($event)" class="w-full accent-violet-400">
              </div>
              <!-- Font Size -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div class="flex justify-between mb-2">
                  <label class="text-sm font-semibold text-gray-300">Font Size</label>
                  <span class="text-violet-400 font-mono">{{ vm.fontSize }}px</span>
                </div>
                <input type="range" min="12" max="120" [value]="vm.fontSize" (input)="setFontSize($event)" class="w-full accent-violet-400">
              </div>
              <!-- Color -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <label class="block text-sm font-semibold text-gray-300 mb-2">Color</label>
                <div class="flex gap-2">
                  @for (c of wmColors; track c) {
                    <button (click)="setFontColor(c)"
                      [attr.aria-label]="'Set color ' + c"
                      [class]="vm.fontColor === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'"
                      [style.background]="c" class="w-8 h-8 rounded-full border border-gray-500 transition-transform"></button>
                  }
                </div>
              </div>

              @if (vm.status === 'processing') {
                <div class="bg-gray-800 rounded-xl p-6 flex flex-col items-center"><app-progress-ring [progress]="vm.progress" [status]="'Adding watermark...'"></app-progress-ring></div>
              } @else if (vm.status === 'success') {
                <button (click)="onDownload(vm)" class="w-full bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-xl font-bold">Download Watermarked</button>
                <button (click)="onReset()" class="text-sm text-center text-gray-400 hover:text-white">Try Another</button>
              } @else {
                <button (click)="onProcess(vm)" [disabled]="!vm.text"
                  class="w-full bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all active:scale-95 disabled:opacity-50">
                  💧 Apply Watermark
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
export class WatermarkComponent {
  private store = inject(Store);
  private workerBridge = inject(WorkerBridgeService);
  readonly vm$ = this.store.select(watermarkFeature.selectWatermarkState);
  videoUrl: string | null = null;
  readonly positions = POSITIONS;
  readonly wmColors = COLORS_WM;
  readonly posToFFmpegXY = posToFFmpegXY;
  opacityHex(opacity: number): string { return Math.round(opacity * 255).toString(16).padStart(2, '0'); }

  getPreviewClass(pos: WatermarkPos): string {
    const map: Record<WatermarkPos, string> = {
      'top-left': 'top-2 left-2', 'top-right': 'top-2 right-2',
      'bottom-left': 'bottom-2 left-2', 'bottom-right': 'bottom-2 right-2',
      'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
    };
    return map[pos];
  }

  onFile(file: File): void { if (this.videoUrl) URL.revokeObjectURL(this.videoUrl); this.videoUrl = URL.createObjectURL(file); this.store.dispatch(WatermarkActions.loadFile({ file })); }
  setText(e: Event): void { this.store.dispatch(WatermarkActions.setText({ text: (e.target as HTMLInputElement).value })); }
  setPosition(position: WatermarkPos): void { this.store.dispatch(WatermarkActions.setPosition({ position })); }
  setOpacity(e: Event): void { this.store.dispatch(WatermarkActions.setOpacity({ opacity: +(e.target as HTMLInputElement).value })); }
  setFontSize(e: Event): void { this.store.dispatch(WatermarkActions.setFontSize({ fontSize: +(e.target as HTMLInputElement).value })); }
  setFontColor(fontColor: string): void { this.store.dispatch(WatermarkActions.setFontColor({ fontColor })); }

  onProcess(state: WatermarkState): void {
    this.store.dispatch(WatermarkActions.startProcessing());
    if (state.inputFile) {
      const worker = new Worker(new URL('./watermark.worker', import.meta.url), { type: 'module' });
      this.workerBridge.runTask(worker, { file: state.inputFile, text: state.text, position: state.position, opacity: state.opacity, fontSize: state.fontSize, fontColor: state.fontColor }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') this.store.dispatch(WatermarkActions.updateProgress({ progress: msg.value }));
          else if (msg.type === 'complete') this.store.dispatch(WatermarkActions.processingSuccess({ outputBlob: new Blob([msg.data as BlobPart], { type: 'video/mp4' }) }));
        },
        error: (err) => this.store.dispatch(WatermarkActions.processingFailure({ message: err.message }))
      });
    }
  }

  onDownload(state: WatermarkState): void {
    if (state.outputBlob) { const url = URL.createObjectURL(state.outputBlob); const a = Object.assign(document.createElement('a'), { href: url, download: 'omni_watermarked.mp4' }); document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 150); }
  }

  onReset(): void { if (this.videoUrl) { URL.revokeObjectURL(this.videoUrl); this.videoUrl = null; } this.store.dispatch(WatermarkActions.resetState()); }
}