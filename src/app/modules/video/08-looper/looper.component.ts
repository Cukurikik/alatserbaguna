import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';

interface LooperState { status: 'idle'|'processing'|'success'|'error'; progress: number; inputFile: File|null; outputBlob: Blob|null; loops: number; }
const initialState: LooperState = { status: 'idle', progress: 0, inputFile: null, outputBlob: null, loops: 3 };

const LooperActions = createActionGroup({ source: 'Looper', events: {
  'Load File': props<{ file: File }>(),
  'Set Loops': props<{ loops: number }>(),
  'Start Processing': emptyProps(),
  'Update Progress': props<{ progress: number }>(),
  'Processing Success': props<{ outputBlob: Blob }>(),
  'Reset State': emptyProps(),
}});

const looperFeature = createFeature({ name: 'looper', reducer: createReducer(initialState,
  on(LooperActions.loadFile, (s, { file }) => ({ ...s, inputFile: file })),
  on(LooperActions.setLoops, (s, { loops }) => ({ ...s, loops })),
  on(LooperActions.startProcessing, (s) => ({ ...s, status: 'processing', progress: 0 })),
  on(LooperActions.updateProgress, (s, { progress }) => ({ ...s, progress })),
  on(LooperActions.processingSuccess, (s, { outputBlob }) => ({ ...s, status: 'success', outputBlob, progress: 100 })),
  on(LooperActions.resetState, () => initialState),
)});

@Component({
  selector: 'app-looper',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 to-sky-400 bg-clip-text text-transparent pb-1">Video Looper</h2>
        <p class="text-gray-400 text-sm mt-1">Create seamless loops using FFmpeg concat protocol for perfect repetition.</p>
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
                <label class="block text-sm font-semibold text-gray-300 mb-4">Number of Loops</label>
                <div class="flex items-center justify-center gap-6">
                  <button (click)="setLoops(vm.loops - 1)" [disabled]="vm.loops <= 2" aria-label="Decrease loops"
                    class="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 text-white text-2xl flex items-center justify-center transition-colors font-bold disabled:opacity-40">−</button>
                  <span class="text-5xl font-extrabold text-cyan-400 font-mono w-16 text-center">{{ vm.loops }}</span>
                  <button (click)="setLoops(vm.loops + 1)" [disabled]="vm.loops >= 20" aria-label="Increase loops"
                    class="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 text-white text-2xl flex items-center justify-center transition-colors font-bold disabled:opacity-40">+</button>
                </div>
                <p class="text-xs text-gray-500 text-center mt-3">Output = original × {{ vm.loops }}</p>
              </div>

              @if (vm.status === 'processing') {
                <div class="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col items-center">
                  <app-progress-ring [progress]="vm.progress" [status]="'Looping...'"></app-progress-ring>
                </div>
              } @else if (vm.status === 'success') {
                <button (click)="onDownload(vm)" class="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl font-bold transition-all flex justify-center gap-2">
                  Download {{ vm.loops }}x Loop
                </button>
                <button (click)="onReset()" class="text-sm text-center text-gray-400 hover:text-white">Try Another</button>
              } @else {
                <button (click)="onProcess(vm)" class="w-full bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all active:scale-95">
                  🔁 Create {{ vm.loops }}-Loop Video
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
export class LooperComponent {
  private store = inject(Store);
  private workerBridge = inject(WorkerBridgeService);
  readonly vm$ = this.store.select(looperFeature.selectLooperState);
  videoUrl: string | null = null;

  setLoops(loops: number): void {
    this.store.dispatch(LooperActions.setLoops({ loops: Math.max(2, Math.min(20, loops)) }));
  }

  onFile(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(LooperActions.loadFile({ file }));
  }

  onProcess(state: LooperState): void {
    this.store.dispatch(LooperActions.startProcessing());
    if (state.inputFile) {
      const worker = new Worker(new URL('./looper.worker', import.meta.url), { type: 'module' });
      this.workerBridge.runTask(worker, { file: state.inputFile, loops: state.loops }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') this.store.dispatch(LooperActions.updateProgress({ progress: msg.value }));
          else if (msg.type === 'complete') this.store.dispatch(LooperActions.processingSuccess({ outputBlob: new Blob([msg.data as BlobPart], { type: 'video/mp4' }) }));
        }
      });
    }
  }

  onDownload(state: LooperState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const a = Object.assign(document.createElement('a'), { href: url, download: `omni_loop_${state.loops}x.mp4` });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  onReset(): void {
    if (this.videoUrl) { URL.revokeObjectURL(this.videoUrl); this.videoUrl = null; }
    this.store.dispatch(LooperActions.resetState());
  }
}