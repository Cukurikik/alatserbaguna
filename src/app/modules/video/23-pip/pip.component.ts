import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';

type PipPosition = 'top-left'|'top-right'|'bottom-left'|'bottom-right';
interface PipState { status: 'idle'|'processing'|'success'|'error'; progress: number; mainFile: File|null; pipFile: File|null; outputBlob: Blob|null; position: PipPosition; pipScale: number; }
const initialState: PipState = { status: 'idle', progress: 0, mainFile: null, pipFile: null, outputBlob: null, position: 'bottom-right', pipScale: 0.25 };

const PipActions = createActionGroup({ source: 'PIP', events: {
  'Load Main': props<{ file: File }>(),
  'Load Pip': props<{ file: File }>(),
  'Set Position': props<{ position: PipPosition }>(),
  'Set Pip Scale': props<{ pipScale: number }>(),
  'Start Processing': emptyProps(),
  'Update Progress': props<{ progress: number }>(),
  'Processing Success': props<{ outputBlob: Blob }>(),
  'Processing Failure': props<{ message: string }>(),
  'Reset State': emptyProps(),
}});

const pipFeature = createFeature({ name: 'pip', reducer: createReducer(initialState,
  on(PipActions.loadMain, (s, { file }) => ({ ...s, mainFile: file })),
  on(PipActions.loadPip, (s, { file }) => ({ ...s, pipFile: file })),
  on(PipActions.setPosition, (s, { position }) => ({ ...s, position })),
  on(PipActions.setPipScale, (s, { pipScale }) => ({ ...s, pipScale })),
  on(PipActions.startProcessing, (s) => ({ ...s, status: 'processing', progress: 0 })),
  on(PipActions.updateProgress, (s, { progress }) => ({ ...s, progress })),
  on(PipActions.processingSuccess, (s, { outputBlob }) => ({ ...s, status: 'success', outputBlob, progress: 100 })),
  on(PipActions.processingFailure, (s) => ({ ...s, status: 'error' })),
  on(PipActions.resetState, () => initialState),
)});

const PIP_POSITIONS: { label: string; value: PipPosition }[] = [
  { label: '↖ Top Left', value: 'top-left' }, { label: '↗ Top Right', value: 'top-right' },
  { label: '↙ Bottom Left', value: 'bottom-left' }, { label: '↘ Bottom Right', value: 'bottom-right' },
];

@Component({
  selector: 'app-pip',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent pb-1">Picture-in-Picture</h2>
        <p class="text-gray-400 text-sm mt-1">Overlay a secondary video on top of the main video using FFmpeg overlay filter.</p>
      </div>

      @if (vm$ | async; as vm) {
        <div class="flex flex-col lg:flex-row gap-6">
          <div class="flex-1 flex flex-col gap-4">
            @if (!vm.mainFile) {
              <div>
                <p class="text-xs font-semibold text-gray-400 mb-2">MAIN VIDEO</p>
                <app-file-drop-zone accept="video/*" (fileDropped)="onMainFile($event)"></app-file-drop-zone>
              </div>
            } @else {
              <div class="relative">
                <p class="text-xs font-semibold text-gray-400 mb-2">MAIN VIDEO</p>
                <app-video-preview [videoUrl]="mainUrl"></app-video-preview>
                <!-- PIP placeholder overlay -->
                @if (vm.pipFile) {
                  <div [class]="getPipClass(vm.position)"
                    [style.width.%]="vm.pipScale * 100"
                    class="absolute border-2 border-yellow-400 rounded-lg overflow-hidden pointer-events-none">
                    <app-video-preview [videoUrl]="pipUrl"></app-video-preview>
                  </div>
                }
              </div>
            }
            <!-- PIP Video drop -->
            @if (vm.mainFile) {
              <div role="button" tabindex="0" aria-label="Drop PIP video"
                (click)="pipInput.click()" (keydown.enter)="pipInput.click()"
                [class]="vm.pipFile ? 'border-yellow-500 bg-yellow-900/20' : 'border-gray-600 hover:border-yellow-400'"
                class="border-2 border-dashed rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400">
                <p class="text-xs font-semibold text-gray-400">PIP VIDEO:</p>
                @if (vm.pipFile) { <p class="text-yellow-300 text-sm font-medium">{{ vm.pipFile.name }}</p> } @else { <p class="text-gray-400">Drop overlay video</p> }
                <input #pipInput type="file" accept="video/*" class="hidden" (change)="onPipFile($event)">
              </div>
            }
          </div>

          <div class="w-full lg:w-72 flex flex-col gap-4">
            <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <label class="block text-sm font-semibold text-gray-300 mb-3">PIP Position</label>
              <div class="grid grid-cols-2 gap-2">
                @for (pos of positions; track pos.value) {
                  <button (click)="setPos(pos.value)"
                    [class]="vm.position === pos.value ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
                    class="py-2.5 rounded-lg text-xs transition-all">{{ pos.label }}</button>
                }
              </div>
            </div>
            <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div class="flex justify-between mb-2"><label class="text-sm font-semibold text-gray-300">PIP Size</label><span class="text-yellow-400 font-mono">{{ (vm.pipScale * 100).toFixed(0) }}%</span></div>
              <input type="range" min="0.1" max="0.5" step="0.01" [value]="vm.pipScale" (input)="setScale($event)" class="w-full accent-yellow-400">
            </div>
            <div class="bg-gray-950 rounded-xl p-3 font-mono text-xs text-yellow-300 break-all">
              overlay={{ getOverlayXY(vm.position) }}
            </div>

            @if (vm.status === 'processing') {
              <div class="bg-gray-800 rounded-xl p-6 flex flex-col items-center"><app-progress-ring [progress]="vm.progress" [status]="'Compositing...'"></app-progress-ring></div>
            } @else if (vm.status === 'success') {
              <button (click)="onDownload(vm)" class="w-full bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-xl">⬇ Download PIP Video</button>
              <button (click)="onReset()" class="text-sm text-center text-gray-400 hover:text-white">Try Another</button>
            } @else {
              <button (click)="onProcess(vm)" [disabled]="!vm.mainFile || !vm.pipFile"
                class="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-all active:scale-95 disabled:opacity-50">
                📺 Render PIP
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PipComponent {
  private store = inject(Store);
  private workerBridge = inject(WorkerBridgeService);
  readonly vm$ = this.store.select(pipFeature.selectPipState);
  mainUrl: string | null = null;
  pipUrl: string | null = null;
  readonly positions = PIP_POSITIONS;

  getPipClass(pos: PipPosition): string {
    const m: Record<PipPosition, string> = { 'top-left': 'top-2 left-2', 'top-right': 'top-2 right-2', 'bottom-left': 'bottom-2 left-2', 'bottom-right': 'bottom-2 right-2' };
    return m[pos];
  }

  getOverlayXY(pos: PipPosition): string {
    const m: Record<PipPosition, string> = { 'top-left': '10:10', 'top-right': 'W-w-10:10', 'bottom-left': '10:H-h-10', 'bottom-right': 'W-w-10:H-h-10' };
    return m[pos];
  }

  onMainFile(file: File): void { if (this.mainUrl) URL.revokeObjectURL(this.mainUrl); this.mainUrl = URL.createObjectURL(file); this.store.dispatch(PipActions.loadMain({ file })); }
  onPipFile(e: Event): void { const f = (e.target as HTMLInputElement).files?.[0]; if (f) { if (this.pipUrl) URL.revokeObjectURL(this.pipUrl); this.pipUrl = URL.createObjectURL(f); this.store.dispatch(PipActions.loadPip({ file: f })); } }
  setPos(position: PipPosition): void { this.store.dispatch(PipActions.setPosition({ position })); }
  setScale(e: Event): void { this.store.dispatch(PipActions.setPipScale({ pipScale: +(e.target as HTMLInputElement).value })); }

  onProcess(state: PipState): void {
    this.store.dispatch(PipActions.startProcessing());
    if (state.mainFile && state.pipFile) {
      const worker = new Worker(new URL('./pip.worker', import.meta.url), { type: 'module' });
      this.workerBridge.runTask(worker, state).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') this.store.dispatch(PipActions.updateProgress({ progress: msg.value }));
          else if (msg.type === 'complete') this.store.dispatch(PipActions.processingSuccess({ outputBlob: new Blob([msg.data as BlobPart ?? new ArrayBuffer(0)], { type: 'video/mp4' }) }));
        },
        error: (err) => this.store.dispatch(PipActions.processingFailure({ message: err.message }))
      });
    }
  }

  onDownload(state: PipState): void {
    if (state.outputBlob) { const url = URL.createObjectURL(state.outputBlob); const a = Object.assign(document.createElement('a'), { href: url, download: 'omni_pip.mp4' }); document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 150); }
  }

  onReset(): void { if (this.mainUrl) URL.revokeObjectURL(this.mainUrl); if (this.pipUrl) URL.revokeObjectURL(this.pipUrl); this.mainUrl = null; this.pipUrl = null; this.store.dispatch(PipActions.resetState()); }
}