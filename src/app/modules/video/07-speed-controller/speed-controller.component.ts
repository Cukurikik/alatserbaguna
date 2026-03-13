import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';

const SPEEDS = [0.25, 0.5, 0.75, 1.5, 2, 4, 8];

interface SpeedState { status: 'idle'|'processing'|'success'|'error'; progress: number; inputFile: File|null; outputBlob: Blob|null; speed: number; }
const initialState: SpeedState = { status: 'idle', progress: 0, inputFile: null, outputBlob: null, speed: 2 };

const SpeedControllerActions = createActionGroup({ source: 'SpeedController', events: {
  'Load File': props<{ file: File }>(),
  'Set Speed': props<{ speed: number }>(),
  'Start Processing': emptyProps(),
  'Update Progress': props<{ progress: number }>(),
  'Processing Success': props<{ outputBlob: Blob }>(),
  'Reset State': emptyProps(),
}});

const speedControllerFeature = createFeature({ name: 'speedController', reducer: createReducer(initialState,
  on(SpeedControllerActions.loadFile, (s, { file }) => ({ ...s, inputFile: file })),
  on(SpeedControllerActions.setSpeed, (s, { speed }) => ({ ...s, speed })),
  on(SpeedControllerActions.startProcessing, (s) => ({ ...s, status: 'processing', progress: 0 })),
  on(SpeedControllerActions.updateProgress, (s, { progress }) => ({ ...s, progress })),
  on(SpeedControllerActions.processingSuccess, (s, { outputBlob }) => ({ ...s, status: 'success', outputBlob, progress: 100 })),
  on(SpeedControllerActions.resetState, () => initialState),
)});

@Component({
  selector: 'app-speed-controller',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent pb-1">Speed Controller</h2>
        <p class="text-gray-400 text-sm mt-1">Speed up or slow down any video with precise setpts &amp; atempo filters.</p>
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
                <label class="block text-sm font-semibold text-gray-300 mb-3">Speed Multiplier</label>
                <div class="grid grid-cols-4 gap-2">
                  @for (sp of speeds; track sp) {
                    <button (click)="setSpeed(sp)"
                      [class]="vm.speed === sp
                        ? 'bg-yellow-500 text-gray-900 font-bold shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                        : 'bg-gray-900 text-gray-400 hover:bg-gray-700'"
                      class="py-2 rounded-lg text-sm transition-all text-center">
                      {{ sp }}x
                    </button>
                  }
                </div>
                <div class="bg-gray-900 p-2 rounded-lg font-mono text-xs text-yellow-300 mt-3">
                  setpts={{ getSetpts(vm.speed) }}*PTS<br>atempo={{ getAtempo(vm.speed) }}
                </div>
              </div>

              @if (vm.status === 'processing') {
                <div class="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col items-center">
                  <app-progress-ring [progress]="vm.progress" [status]="'Processing...'"></app-progress-ring>
                </div>
              } @else if (vm.status === 'success') {
                <button (click)="onDownload(vm)" class="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 py-3 rounded-xl font-bold transition-all flex justify-center gap-2">
                  Download {{ vm.speed }}x Video
                </button>
                <button (click)="onReset()" class="text-sm text-center text-gray-400 hover:text-white">Try Another</button>
              } @else {
                <button (click)="onProcess(vm)" class="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-gray-900 font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-all active:scale-95">
                  Apply {{ vm.speed }}x Speed
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
export class SpeedControllerComponent {
  private store = inject(Store);
  private workerBridge = inject(WorkerBridgeService);
  readonly vm$ = this.store.select(speedControllerFeature.selectSpeedControllerState);
  readonly speeds = SPEEDS;
  videoUrl: string | null = null;

  getSetpts(speed: number): string { return (1 / speed).toFixed(3); }
  getAtempo(speed: number): string {
    if (speed <= 2 && speed >= 0.5) return speed.toString();
    if (speed > 2) return `2.0,atempo=${(speed / 2).toFixed(2)}`;
    return `0.5,atempo=${(speed / 0.5).toFixed(2)}`;
  }

  setSpeed(speed: number): void { this.store.dispatch(SpeedControllerActions.setSpeed({ speed })); }

  onFile(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(SpeedControllerActions.loadFile({ file }));
  }

  onProcess(state: SpeedState): void {
    this.store.dispatch(SpeedControllerActions.startProcessing());
    if (state.inputFile) {
      const worker = new Worker(new URL('./speed-controller.worker', import.meta.url), { type: 'module' });
      this.workerBridge.runTask(worker, { file: state.inputFile, speed: state.speed }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') this.store.dispatch(SpeedControllerActions.updateProgress({ progress: msg.value }));
          else if (msg.type === 'complete') this.store.dispatch(SpeedControllerActions.processingSuccess({ outputBlob: new Blob([msg.data as BlobPart], { type: 'video/mp4' }) }));
        }
      });
    }
  }

  onDownload(state: SpeedState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const a = Object.assign(document.createElement('a'), { href: url, download: `omni_${state.speed}x.mp4` });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  onReset(): void {
    if (this.videoUrl) { URL.revokeObjectURL(this.videoUrl); this.videoUrl = null; }
    this.store.dispatch(SpeedControllerActions.resetState());
  }
}