import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';

type FlipDir = 'none' | 'horizontal' | 'vertical' | 'both';
type RotAngle = 0 | 90 | 180 | 270;

interface FlipRotateState { status: 'idle'|'processing'|'success'|'error'; progress: number; inputFile: File|null; outputBlob: Blob|null; flip: FlipDir; rotation: RotAngle; }
const initialState: FlipRotateState = { status: 'idle', progress: 0, inputFile: null, outputBlob: null, flip: 'none', rotation: 0 };

const FlipRotateActions = createActionGroup({ source: 'FlipRotate', events: {
  'Load File': props<{ file: File }>(),
  'Set Flip': props<{ flip: FlipDir }>(),
  'Set Rotation': props<{ rotation: number }>(),
  'Start Processing': emptyProps(),
  'Update Progress': props<{ progress: number }>(),
  'Processing Success': props<{ outputBlob: Blob }>(),
  'Reset State': emptyProps(),
}});

const flipRotateFeature = createFeature({ name: 'flipRotate', reducer: createReducer(initialState,
  on(FlipRotateActions.loadFile, (s, { file }) => ({ ...s, inputFile: file })),
  on(FlipRotateActions.setFlip, (s, { flip }) => ({ ...s, flip })),
  on(FlipRotateActions.setRotation, (s, { rotation }) => ({ ...s, rotation: rotation as RotAngle })),
  on(FlipRotateActions.startProcessing, (s) => ({ ...s, status: 'processing', progress: 0 })),
  on(FlipRotateActions.updateProgress, (s, { progress }) => ({ ...s, progress })),
  on(FlipRotateActions.processingSuccess, (s, { outputBlob }) => ({ ...s, status: 'success', outputBlob, progress: 100 })),
  on(FlipRotateActions.resetState, () => initialState),
)});

@Component({
  selector: 'app-flip-rotate',
  standalone: true,
  imports: [CommonModule, AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-fuchsia-400 to-pink-500 bg-clip-text text-transparent pb-1">Flip & Rotate</h2>
        <p class="text-gray-400 text-sm mt-1">Mirror or rotate video using FFmpeg vflip/hflip/transpose filters (GPU re-encode).</p>
      </div>

      <ng-container *ngIf="vm$ | async as vm">
        <ng-container *ngIf="!vm.inputFile">
          <div class="flex-1 flex flex-col justify-center">
            <app-file-drop-zone accept="video/*" (fileDropped)="onFile($event)"></app-file-drop-zone>
          </div>
        </ng-container>

        <ng-container *ngIf="vm.inputFile">
          <div class="flex flex-col lg:flex-row gap-6">
            <div class="flex-1">
              <div [style.transform]="getTransform(vm.flip, vm.rotation)" [style.transition]="'transform 0.4s ease'">
                <app-video-preview [videoUrl]="videoUrl"></app-video-preview>
              </div>
            </div>

            <div class="w-full lg:w-80 flex flex-col gap-4">
              <!-- Flip -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-5">
                <label class="block text-sm font-semibold text-gray-300 mb-3">Flip</label>
                <div class="grid grid-cols-2 gap-2">
                  <ng-container *ngFor="let option of flipOptions">
                    <button (click)="setFlip(option.value)"
                      [class]="vm.flip === option.value ? 'bg-fuchsia-600 text-white shadow-md' : 'bg-gray-900 text-gray-400 hover:bg-gray-700'"
                      class="py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2">
                      {{ option.icon }} {{ option.label }}
                    </button>
                  </ng-container>
                </div>
              </div>

              <!-- Rotate -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-5">
                <label class="block text-sm font-semibold text-gray-300 mb-3">Rotation</label>
                <div class="grid grid-cols-4 gap-2">
                  <ng-container *ngFor="let deg of [0, 90, 180, 270]">
                    <button (click)="setRotation(deg)"
                      [class]="vm.rotation === deg ? 'bg-pink-600 text-white shadow-md' : 'bg-gray-900 text-gray-400 hover:bg-gray-700'"
                      class="py-2.5 rounded-lg text-sm font-mono transition-all">
                      {{ deg }}°
                    </button>
                  </ng-container>
                </div>
              </div>

              <ng-container *ngIf="vm.status === 'processing'">
                <div class="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col items-center">
                  <app-progress-ring [progress]="vm.progress" [status]="'Transforming...'"></app-progress-ring>
                </div>
              </ng-container>
              <ng-container *ngIf="vm.status === 'success'">
                <button (click)="onDownload(vm)" class="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white py-3 rounded-xl font-bold transition-all flex justify-center gap-2">Download Transformed</button>
                <button (click)="onReset()" class="text-sm text-center text-gray-400 hover:text-white">Try Another</button>
              </ng-container>
              <ng-container *ngIf="vm.status === 'idle' || vm.status === 'error'">
                <button (click)="onProcess(vm)" [disabled]="vm.flip === 'none' && vm.rotation === 0"
                  class="w-full bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-400 hover:to-pink-400 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(217,70,239,0.4)] transition-all active:scale-95 disabled:opacity-50">
                  Apply Transform
                </button>
              </ng-container>
            </div>
          </div>
        </ng-container>
      </ng-container>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlipRotateComponent {
  private store = inject(Store);
  private workerBridge = inject(WorkerBridgeService);
  readonly vm$ = this.store.select(flipRotateFeature.selectFlipRotateState);
  videoUrl: string | null = null;

  readonly flipOptions = [
    { value: 'none', label: 'None', icon: '↔' },
    { value: 'horizontal', label: 'Horizontal', icon: '⟺' },
    { value: 'vertical', label: 'Vertical', icon: '⟾' },
    { value: 'both', label: 'Both', icon: '⤢' },
  ];

  getTransform(flip: string, rotation: number): string {
    const scaleX = flip === 'horizontal' || flip === 'both' ? -1 : 1;
    const scaleY = flip === 'vertical' || flip === 'both' ? -1 : 1;
    return `scale(${scaleX}, ${scaleY}) rotate(${rotation}deg)`;
  }

  setFlip(flip: string): void { this.store.dispatch(FlipRotateActions.setFlip({ flip: flip as FlipDir })); }
  setRotation(rotation: number): void { this.store.dispatch(FlipRotateActions.setRotation({ rotation })); }
  onFile(file: File): void { if (this.videoUrl) URL.revokeObjectURL(this.videoUrl); this.videoUrl = URL.createObjectURL(file); this.store.dispatch(FlipRotateActions.loadFile({ file })); }

  onProcess(state: FlipRotateState): void {
    this.store.dispatch(FlipRotateActions.startProcessing());
    if (state.inputFile) {
      const worker = new Worker(new URL('./flip-rotate.worker', import.meta.url), { type: 'module' });
      this.workerBridge.runTask(worker, { file: state.inputFile, flip: state.flip, rotation: state.rotation }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') this.store.dispatch(FlipRotateActions.updateProgress({ progress: msg.value }));
          else if (msg.type === 'complete') this.store.dispatch(FlipRotateActions.processingSuccess({ outputBlob: new Blob([msg.data as BlobPart], { type: 'video/mp4' }) }));
        }
      });
    }
  }

  onDownload(state: FlipRotateState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const a = Object.assign(document.createElement('a'), { href: url, download: 'omni_transformed.mp4' });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  onReset(): void { if (this.videoUrl) { URL.revokeObjectURL(this.videoUrl); this.videoUrl = null; } this.store.dispatch(FlipRotateActions.resetState()); }
}