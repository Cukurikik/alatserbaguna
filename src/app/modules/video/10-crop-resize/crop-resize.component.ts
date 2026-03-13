import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { map } from 'rxjs';

interface CropResizeState { status: 'idle'|'processing'|'success'|'error'; progress: number; inputFile: File|null; outputBlob: Blob|null; x: number; y: number; w: number; h: number; scaleW: number; scaleH: number; mode: 'crop'|'resize'; }
const initialCRState: CropResizeState = { status: 'idle', progress: 0, inputFile: null, outputBlob: null, x: 0, y: 0, w: 1920, h: 1080, scaleW: 1280, scaleH: 720, mode: 'crop' };

export const CropResizeActions = createActionGroup({ source: 'CropResize', events: {
  'Load File': props<{ file: File }>(),
  'Set Mode': props<{ mode: 'crop'|'resize' }>(),
  'Set Crop': props<{ x: number; y: number; w: number; h: number }>(),
  'Set Scale': props<{ scaleW: number; scaleH: number }>(),
  'Start Processing': emptyProps(),
  'Update Progress': props<{ progress: number }>(),
  'Processing Success': props<{ outputBlob: Blob }>(),
  'Reset State': emptyProps(),
}});

export const cropResizeFeature = createFeature({ name: 'cropResize', reducer: createReducer(initialCRState,
  on(CropResizeActions.loadFile, (s, { file }) => ({ ...s, inputFile: file })),
  on(CropResizeActions.setMode, (s, { mode }) => ({ ...s, mode })),
  on(CropResizeActions.setCrop, (s, v) => ({ ...s, ...v })),
  on(CropResizeActions.setScale, (s, { scaleW, scaleH }) => ({ ...s, scaleW, scaleH })),
  on(CropResizeActions.startProcessing, (s) => ({ ...s, status: 'processing', progress: 0 })),
  on(CropResizeActions.updateProgress, (s, { progress }) => ({ ...s, progress })),
  on(CropResizeActions.processingSuccess, (s, { outputBlob }) => ({ ...s, status: 'success', outputBlob, progress: 100 })),
  on(CropResizeActions.resetState, () => initialCRState),
)});

const PRESET_SCALES = [
  { label: '4K', w: 3840, h: 2160 }, { label: '1080p', w: 1920, h: 1080 },
  { label: '720p', w: 1280, h: 720 }, { label: '480p', w: 854, h: 480 },
  { label: 'Square', w: 1080, h: 1080 }, { label: '9:16', w: 1080, h: 1920 },
];

@Component({
  selector: 'app-crop-resize',
  standalone: true,
  imports: [CommonModule, AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-lime-400 to-green-400 bg-clip-text text-transparent pb-1">Crop & Resize</h2>
        <p class="text-gray-400 text-sm mt-1">Crop with ffmpeg crop= filter or resize with scale= filter. Pixel-perfect output.</p>
      </div>

      <ng-container *ngIf="vm$ | async as vm">
        <ng-container *ngIf="!vm.inputFile">
          <div class="flex-1 flex flex-col justify-center">
            <app-file-drop-zone accept="video/*" (fileDropped)="onFile($event)"></app-file-drop-zone>
          </div>
        </ng-container>

        <ng-container *ngIf="vm.inputFile">
          <div class="flex flex-col lg:flex-row gap-6">
            <div class="flex-1"><app-video-preview [videoUrl]="videoUrl"></app-video-preview></div>
            <div class="w-full lg:w-96 flex flex-col gap-4">

              <!-- Mode Toggle -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-2 flex gap-2">
                <button (click)="dispatch(CropResizeActions.setMode({ mode: 'crop' }))"
                  [class]="vm.mode === 'crop' ? 'bg-lime-600 text-white' : 'text-gray-400 hover:text-white'"
                  class="flex-1 py-2 rounded-lg text-sm font-semibold transition-all">✂️ Crop</button>
                <button (click)="dispatch(CropResizeActions.setMode({ mode: 'resize' }))"
                  [class]="vm.mode === 'resize' ? 'bg-lime-600 text-white' : 'text-gray-400 hover:text-white'"
                  class="flex-1 py-2 rounded-lg text-sm font-semibold transition-all">⇔ Resize</button>
              </div>

              <ng-container *ngIf="vm.mode === 'crop'">
                <div class="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col gap-3">
                  <label class="text-sm font-semibold text-gray-300">Crop Region (pixels)</label>
                  <div class="grid grid-cols-2 gap-3">
                    <ng-container *ngFor="let field of cropFields">
                      <div class="bg-gray-900 rounded-lg p-3">
                        <span class="block text-xs text-gray-400 uppercase tracking-widest mb-1">{{ field.label }}</span>
                        <input type="number" [value]="getCropValue(field.key, vm)" min="0"
                          (input)="updateCrop(field.key, +$any($event.target).value, vm)"
                          class="w-full bg-transparent text-white font-mono text-sm outline-none">
                      </div>
                    </ng-container>
                  </div>
                  <div class="bg-gray-900 rounded-lg px-3 py-2 font-mono text-xs text-lime-300">
                    crop={{ vm.w }}:{{ vm.h }}:{{ vm.x }}:{{ vm.y }}
                  </div>
                </div>
              </ng-container>

              <ng-container *ngIf="vm.mode === 'resize'">
                <div class="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col gap-3">
                  <label class="text-sm font-semibold text-gray-300">Output Resolution</label>
                  <div class="grid grid-cols-3 gap-2">
                    <ng-container *ngFor="let preset of scalePresets">
                      <button (click)="dispatch(CropResizeActions.setScale({ scaleW: preset.w, scaleH: preset.h }))"
                        [class]="vm.scaleW === preset.w && vm.scaleH === preset.h ? 'bg-lime-600 text-white shadow-md' : 'bg-gray-900 text-gray-400 hover:bg-gray-700'"
                        class="py-2 rounded-lg text-sm font-medium transition-all">
                        {{ preset.label }}
                      </button>
                    </ng-container>
                  </div>
                  <div class="bg-gray-900 rounded-lg px-3 py-2 font-mono text-xs text-lime-300">
                    scale={{ vm.scaleW }}:{{ vm.scaleH }}
                  </div>
                </div>
              </ng-container>

              <ng-container *ngIf="vm.status === 'processing'">
                <div class="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col items-center">
                  <app-progress-ring [progress]="vm.progress" [status]="vm.mode === 'crop' ? 'Cropping...' : 'Resizing...'"></app-progress-ring>
                </div>
              </ng-container>
              <ng-container *ngIf="vm.status === 'success'">
                <button (click)="onDownload(vm)" class="w-full bg-lime-600 hover:bg-lime-500 text-white py-3 rounded-xl font-bold transition-all flex justify-center gap-2">Download Output</button>
                <button (click)="onReset()" class="text-sm text-center text-gray-400 hover:text-white">Try Another</button>
              </ng-container>
              <ng-container *ngIf="vm.status === 'idle' || vm.status === 'error'">
                <button (click)="onProcess()" class="w-full bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-400 hover:to-green-400 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(132,204,22,0.4)] transition-all active:scale-95">
                  Apply {{ vm.mode === 'crop' ? 'Crop' : 'Resize' }}
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
export class CropResizeComponent {
  private store = inject(Store);
  private workerBridge = inject(WorkerBridgeService);
  readonly CropResizeActions = CropResizeActions;
  readonly vm$ = this.store.select(cropResizeFeature.selectCropResizeState);
  videoUrl: string | null = null;
  readonly scalePresets = PRESET_SCALES;
  readonly cropFields = [
    { key: 'x', label: 'X Offset' }, { key: 'y', label: 'Y Offset' },
    { key: 'w', label: 'Width' }, { key: 'h', label: 'Height' }
  ];

  dispatch(action: any): void { this.store.dispatch(action); }

  getCropValue(key: string, state: CropResizeState): number {
    return (state as any)[key] as number;
  }

  updateCrop(key: string, value: number, state: CropResizeState): void {
    this.store.dispatch(CropResizeActions.setCrop({ x: state.x, y: state.y, w: state.w, h: state.h, [key]: value }));
  }

  onFile(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(CropResizeActions.loadFile({ file }));
  }

  onProcess(): void {
    this.store.dispatch(CropResizeActions.startProcessing());
    this.vm$.subscribe(state => {
      if (state.status === 'processing' && state.inputFile) {
        const worker = new Worker(new URL('./crop-resize.worker', import.meta.url), { type: 'module' });
        this.workerBridge.runTask(worker, state).subscribe({
          next: (msg) => {
            if (msg.type === 'progress') this.store.dispatch(CropResizeActions.updateProgress({ progress: msg.value }));
            else if (msg.type === 'complete') this.store.dispatch(CropResizeActions.processingSuccess({ outputBlob: new Blob([msg.data as BlobPart], { type: 'video/mp4' }) }));
          }
        });
      }
    }).unsubscribe();
  }

  onDownload(state: CropResizeState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const a = Object.assign(document.createElement('a'), { href: url, download: `omni_${state.mode}.mp4` });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  onReset(): void {
    if (this.videoUrl) { URL.revokeObjectURL(this.videoUrl); this.videoUrl = null; }
    this.store.dispatch(CropResizeActions.resetState());
  }
}