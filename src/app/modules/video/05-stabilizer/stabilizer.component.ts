import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';

interface StabilizerState { status: 'idle'|'processing'|'success'|'error'; progress: number; inputFile: File|null; outputBlob: Blob|null; smoothing: number; }
const initialState: StabilizerState = { status: 'idle', progress: 0, inputFile: null, outputBlob: null, smoothing: 10 };

const StabilizerActions = createActionGroup({ source: 'Stabilizer', events: {
  'Load File': props<{ file: File }>(),
  'Set Smoothing': props<{ smoothing: number }>(),
  'Start Processing': emptyProps(),
  'Update Progress': props<{ progress: number }>(),
  'Processing Success': props<{ outputBlob: Blob }>(),
  'Processing Failure': props<{ message: string }>(),
  'Reset State': emptyProps(),
}});

const stabilizerFeature = createFeature({ name: 'stabilizer', reducer: createReducer(initialState,
  on(StabilizerActions.loadFile, (s, { file }) => ({ ...s, inputFile: file })),
  on(StabilizerActions.setSmoothing, (s, { smoothing }) => ({ ...s, smoothing })),
  on(StabilizerActions.startProcessing, (s) => ({ ...s, status: 'processing', progress: 0 })),
  on(StabilizerActions.updateProgress, (s, { progress }) => ({ ...s, progress })),
  on(StabilizerActions.processingSuccess, (s, { outputBlob }) => ({ ...s, status: 'success', outputBlob, progress: 100 })),
  on(StabilizerActions.processingFailure, (s) => ({ ...s, status: 'error' })),
  on(StabilizerActions.resetState, () => initialState),
)});

@Component({
  selector: 'app-stabilizer',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent pb-1">Video Stabilizer</h2>
        <p class="text-gray-400 text-sm mt-1">Eliminate camera shake using FFmpeg vidstab filters (detect + transform).</p>
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
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-5">
                <div class="flex justify-between mb-3">
                  <label class="text-sm font-semibold text-gray-300">Smoothing Strength</label>
                  <span class="text-indigo-400 font-mono font-bold">{{ vm.smoothing }}</span>
                </div>
                <input type="range" min="1" max="30" [value]="vm.smoothing" class="w-full accent-indigo-400"
                  (input)="setSmoothing($event)">
                <div class="flex justify-between text-xs text-gray-500 mt-1"><span>Subtle</span><span>Max Smooth</span></div>
              </div>

              @if (vm.status === 'processing') {
                <div class="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col items-center">
                  <app-progress-ring [progress]="vm.progress" [status]="'Stabilizing...'"></app-progress-ring>
                  <p class="text-xs text-gray-400 mt-3 text-center">Pass 1: Motion detection<br>Pass 2: Transform &amp; render</p>
                </div>
              } @else if (vm.status === 'success') {
                <button (click)="onDownload(vm)" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  Download Stabilized
                </button>
                <button (click)="onReset()" class="text-sm text-center text-gray-400 hover:text-white">Try Another</button>
              } @else {
                <button (click)="onStabilize(vm)"
                  class="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all active:scale-95">
                  Stabilize Video
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
export class StabilizerComponent {
  private store = inject(Store);
  private workerBridge = inject(WorkerBridgeService);
  readonly vm$ = this.store.select(stabilizerFeature.selectStabilizerState);
  videoUrl: string | null = null;

  setSmoothing(e: Event): void {
    this.store.dispatch(StabilizerActions.setSmoothing({ smoothing: +(e.target as HTMLInputElement).value }));
  }

  onFile(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(StabilizerActions.loadFile({ file }));
  }

  onStabilize(state: StabilizerState): void {
    this.store.dispatch(StabilizerActions.startProcessing());
    if (state.inputFile) {
      const worker = new Worker(new URL('./stabilizer.worker', import.meta.url), { type: 'module' });
      this.workerBridge.runTask(worker, { file: state.inputFile, smoothing: state.smoothing }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') this.store.dispatch(StabilizerActions.updateProgress({ progress: msg.value }));
          else if (msg.type === 'complete') this.store.dispatch(StabilizerActions.processingSuccess({ outputBlob: new Blob([msg.data as BlobPart], { type: 'video/mp4' }) }));
        },
        error: (err) => this.store.dispatch(StabilizerActions.processingFailure({ message: err.message }))
      });
    }
  }

  onDownload(state: StabilizerState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const a = Object.assign(document.createElement('a'), { href: url, download: 'omni_stabilized.mp4' });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  onReset(): void {
    if (this.videoUrl) { URL.revokeObjectURL(this.videoUrl); this.videoUrl = null; }
    this.store.dispatch(StabilizerActions.resetState());
  }
}