import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';

interface InterpolatorState { status: 'idle'|'processing'|'success'|'error'; progress: number; inputFile: File|null; outputBlob: Blob|null; targetFps: number; }
const initialState: InterpolatorState = { status: 'idle', progress: 0, inputFile: null, outputBlob: null, targetFps: 60 };

const InterpolatorActions = createActionGroup({ source: 'Interpolator', events: {
  'Load File': props<{ file: File }>(),
  'Set Target Fps': props<{ targetFps: number }>(),
  'Start Processing': emptyProps(),
  'Update Progress': props<{ progress: number }>(),
  'Processing Success': props<{ outputBlob: Blob }>(),
  'Processing Failure': props<{ message: string }>(),
  'Reset State': emptyProps(),
}});

const interpolatorFeature = createFeature({ name: 'interpolator', reducer: createReducer(initialState,
  on(InterpolatorActions.loadFile, (s, { file }) => ({ ...s, inputFile: file })),
  on(InterpolatorActions.setTargetFps, (s, { targetFps }) => ({ ...s, targetFps })),
  on(InterpolatorActions.startProcessing, (s) => ({ ...s, status: 'processing', progress: 0 })),
  on(InterpolatorActions.updateProgress, (s, { progress }) => ({ ...s, progress })),
  on(InterpolatorActions.processingSuccess, (s, { outputBlob }) => ({ ...s, status: 'success', outputBlob, progress: 100 })),
  on(InterpolatorActions.processingFailure, (s) => ({ ...s, status: 'error' })),
  on(InterpolatorActions.resetState, () => initialState),
)});

const FPS_TARGETS = [24, 30, 48, 60, 120];

@Component({
  selector: 'app-interpolator',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent pb-1">Frame Interpolator</h2>
        <p class="text-gray-400 text-sm mt-1">Boost video FPS using FFmpeg minterpolate filter (motion-compensated interpolation).</p>
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
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-5">
                <label class="block text-sm font-semibold text-gray-300 mb-3">Target Frame Rate</label>
                <div class="grid grid-cols-3 gap-2 mb-4">
                  @for (fps of fpsTargets; track fps) {
                    <button (click)="setFps(fps)"
                      [class]="vm.targetFps === fps ? 'bg-sky-600 text-white shadow-[0_0_10px_rgba(14,165,233,0.5)] font-bold' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
                      class="py-2.5 rounded-lg text-sm font-mono transition-all">{{ fps }} fps</button>
                  }
                </div>
                <div class="bg-gray-950 rounded-lg p-3 font-mono text-xs text-sky-300">
                  -vf minterpolate='fps={{ vm.targetFps }}:mi_mode=mci:mc_mode=aobmc'
                </div>
              </div>
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-yellow-900/40 flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01"/></svg>
                </div>
                <p class="text-xs text-gray-400">Interpolation is CPU-intensive. A 1-minute video may take several minutes to process.</p>
              </div>

              @if (vm.status === 'processing') {
                <div class="bg-gray-800 rounded-xl p-6 flex flex-col items-center"><app-progress-ring [progress]="vm.progress" [status]="'Interpolating frames...'"></app-progress-ring></div>
              } @else if (vm.status === 'success') {
                <button (click)="onDownload(vm)" class="w-full bg-sky-600 hover:bg-sky-500 text-white py-3 rounded-xl font-bold">Download {{ vm.targetFps }}fps Video</button>
                <button (click)="onReset()" class="text-sm text-center text-gray-400 hover:text-white">Try Another</button>
              } @else {
                <button (click)="onProcess(vm)" class="w-full bg-gradient-to-r from-sky-500 to-blue-500 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(14,165,233,0.4)] transition-all active:scale-95">
                  ⚡ Interpolate to {{ vm.targetFps }}fps
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
export class InterpolatorComponent {
  private store = inject(Store);
  private workerBridge = inject(WorkerBridgeService);
  readonly vm$ = this.store.select(interpolatorFeature.selectInterpolatorState);
  videoUrl: string | null = null;
  readonly fpsTargets = FPS_TARGETS;

  setFps(targetFps: number): void { this.store.dispatch(InterpolatorActions.setTargetFps({ targetFps })); }
  onFile(file: File): void { if (this.videoUrl) URL.revokeObjectURL(this.videoUrl); this.videoUrl = URL.createObjectURL(file); this.store.dispatch(InterpolatorActions.loadFile({ file })); }

  onProcess(state: InterpolatorState): void {
    this.store.dispatch(InterpolatorActions.startProcessing());
    if (state.inputFile) {
      const worker = new Worker(new URL('./interpolator.worker', import.meta.url), { type: 'module' });
      this.workerBridge.runTask(worker, { file: state.inputFile, targetFps: state.targetFps }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') this.store.dispatch(InterpolatorActions.updateProgress({ progress: msg.value }));
          else if (msg.type === 'complete') this.store.dispatch(InterpolatorActions.processingSuccess({ outputBlob: new Blob([msg.data as BlobPart], { type: 'video/mp4' }) }));
        },
        error: (err) => this.store.dispatch(InterpolatorActions.processingFailure({ message: err.message }))
      });
    }
  }

  onDownload(state: InterpolatorState): void {
    if (state.outputBlob) { const url = URL.createObjectURL(state.outputBlob); const a = Object.assign(document.createElement('a'), { href: url, download: `omni_${state.targetFps}fps.mp4` }); document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 150); }
  }

  onReset(): void { if (this.videoUrl) { URL.revokeObjectURL(this.videoUrl); this.videoUrl = null; } this.store.dispatch(InterpolatorActions.resetState()); }
}