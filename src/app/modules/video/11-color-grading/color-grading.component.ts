import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';

interface ColorGradingState {
  status: 'idle'|'processing'|'success'|'error';
  progress: number;
  inputFile: File|null;
  outputBlob: Blob|null;
  brightness: number; contrast: number; saturation: number;
  gamma: number; hue: number; sharpness: number;
}
const initialState: ColorGradingState = {
  status: 'idle', progress: 0, inputFile: null, outputBlob: null,
  brightness: 0, contrast: 1, saturation: 1, gamma: 1, hue: 0, sharpness: 0
};

const ColorGradingActions = createActionGroup({ source: 'ColorGrading', events: {
  'Load File': props<{ file: File }>(),
  'Set Brightness': props<{ brightness: number }>(),
  'Set Contrast': props<{ contrast: number }>(),
  'Set Saturation': props<{ saturation: number }>(),
  'Set Gamma': props<{ gamma: number }>(),
  'Set Hue': props<{ hue: number }>(),
  'Set Sharpness': props<{ sharpness: number }>(),
  'Start Processing': emptyProps(),
  'Update Progress': props<{ progress: number }>(),
  'Processing Success': props<{ outputBlob: Blob }>(),
  'Processing Failure': props<{ message: string }>(),
  'Reset State': emptyProps(),
}});

const colorGradingFeature = createFeature({ name: 'colorGrading', reducer: createReducer(initialState,
  on(ColorGradingActions.loadFile, (s, { file }) => ({ ...s, inputFile: file })),
  on(ColorGradingActions.setBrightness, (s, { brightness }) => ({ ...s, brightness })),
  on(ColorGradingActions.setContrast, (s, { contrast }) => ({ ...s, contrast })),
  on(ColorGradingActions.setSaturation, (s, { saturation }) => ({ ...s, saturation })),
  on(ColorGradingActions.setGamma, (s, { gamma }) => ({ ...s, gamma })),
  on(ColorGradingActions.setHue, (s, { hue }) => ({ ...s, hue })),
  on(ColorGradingActions.setSharpness, (s, { sharpness }) => ({ ...s, sharpness })),
  on(ColorGradingActions.startProcessing, (s) => ({ ...s, status: 'processing', progress: 0 })),
  on(ColorGradingActions.updateProgress, (s, { progress }) => ({ ...s, progress })),
  on(ColorGradingActions.processingSuccess, (s, { outputBlob }) => ({ ...s, status: 'success', outputBlob, progress: 100 })),
  on(ColorGradingActions.processingFailure, (s) => ({ ...s, status: 'error' })),
  on(ColorGradingActions.resetState, () => initialState),
)});

interface SliderDef { label: string; key: keyof ColorGradingState; min: number; max: number; step: number; action: (v: number) => any; color: string; }

@Component({
  selector: 'app-color-grading',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent pb-1">Color Grading</h2>
        <p class="text-gray-400 text-sm mt-1">Adjust brightness, contrast, saturation, gamma, hue &amp; sharpness with FFmpeg eq filter.</p>
      </div>

      @if (vm$ | async; as vm) {
        @if (!vm.inputFile) {
          <div class="flex-1 flex flex-col justify-center">
            <app-file-drop-zone accept="video/*" (fileDropped)="onFile($event)"></app-file-drop-zone>
          </div>
        } @else {
          <div class="flex flex-col lg:flex-row gap-6">
            <div class="flex-1 flex flex-col gap-4">
              <app-video-preview [videoUrl]="videoUrl"></app-video-preview>
              <!-- FFmpeg filter preview -->
              <div class="bg-gray-950 border border-gray-700 rounded-xl p-4 font-mono text-xs text-orange-300 break-all">
                eq=brightness={{ vm.brightness }}:contrast={{ vm.contrast }}:saturation={{ vm.saturation }}:gamma={{ vm.gamma }},hue=h={{ vm.hue }}@if (vm.sharpness !== 0) {,unsharp=5:5:{{ vm.sharpness }}:3:3:0}
              </div>
            </div>

            <div class="w-full lg:w-80 flex flex-col gap-3">
              @for (slider of sliders; track slider.key) {
                <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
                  <div class="flex justify-between mb-2">
                    <label class="text-sm font-medium text-gray-300">{{ slider.label }}</label>
                    <span [class]="'font-mono text-sm font-bold text-' + slider.color + '-400'">{{ getVal(slider.key, vm) }}</span>
                  </div>
                  <input type="range" [min]="slider.min" [max]="slider.max" [step]="slider.step"
                    [value]="getVal(slider.key, vm)"
                    (input)="onSlider(slider.action, $event)"
                    [class]="'w-full accent-' + slider.color + '-400'">
                </div>
              }

              <button (click)="resetSliders()" class="text-xs text-gray-500 hover:text-gray-300 text-center mt-1">↺ Reset All</button>

              @if (vm.status === 'processing') {
                <div class="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col items-center">
                  <app-progress-ring [progress]="vm.progress" [status]="'Grading...'"></app-progress-ring>
                </div>
              } @else if (vm.status === 'success') {
                <button (click)="onDownload(vm)" class="w-full bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-xl font-bold transition-all flex justify-center gap-2">Download Graded Video</button>
                <button (click)="onReset()" class="text-sm text-center text-gray-400 hover:text-white">Try Another</button>
              } @else {
                <button (click)="onProcess(vm)" class="w-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all active:scale-95">
                  Apply Color Grade
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
export class ColorGradingComponent {
  private store = inject(Store);
  private workerBridge = inject(WorkerBridgeService);
  readonly vm$ = this.store.select(colorGradingFeature.selectColorGradingState);
  videoUrl: string | null = null;

  readonly sliders: SliderDef[] = [
    { label: 'Brightness', key: 'brightness', min: -1, max: 1, step: 0.01, action: (v) => ColorGradingActions.setBrightness({ brightness: v }), color: 'yellow' },
    { label: 'Contrast', key: 'contrast', min: 0, max: 3, step: 0.01, action: (v) => ColorGradingActions.setContrast({ contrast: v }), color: 'blue' },
    { label: 'Saturation', key: 'saturation', min: 0, max: 3, step: 0.01, action: (v) => ColorGradingActions.setSaturation({ saturation: v }), color: 'pink' },
    { label: 'Gamma', key: 'gamma', min: 0.1, max: 10, step: 0.01, action: (v) => ColorGradingActions.setGamma({ gamma: v }), color: 'purple' },
    { label: 'Hue Shift (°)', key: 'hue', min: -360, max: 360, step: 1, action: (v) => ColorGradingActions.setHue({ hue: v }), color: 'green' },
    { label: 'Sharpness', key: 'sharpness', min: -1.5, max: 1.5, step: 0.01, action: (v) => ColorGradingActions.setSharpness({ sharpness: v }), color: 'orange' },
  ];

  getVal(key: keyof ColorGradingState, state: ColorGradingState): number {
    return state[key] as number;
  }

  onSlider(action: (v: number) => any, e: Event): void {
    this.store.dispatch(action(+(e.target as HTMLInputElement).value));
  }

  resetSliders(): void {
    this.store.dispatch(ColorGradingActions.setBrightness({ brightness: 0 }));
    this.store.dispatch(ColorGradingActions.setContrast({ contrast: 1 }));
    this.store.dispatch(ColorGradingActions.setSaturation({ saturation: 1 }));
    this.store.dispatch(ColorGradingActions.setGamma({ gamma: 1 }));
    this.store.dispatch(ColorGradingActions.setHue({ hue: 0 }));
    this.store.dispatch(ColorGradingActions.setSharpness({ sharpness: 0 }));
  }

  onFile(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(ColorGradingActions.loadFile({ file }));
  }

  onProcess(state: ColorGradingState): void {
    this.store.dispatch(ColorGradingActions.startProcessing());
    if (state.inputFile) {
      const worker = new Worker(new URL('./color-grading.worker', import.meta.url), { type: 'module' });
      this.workerBridge.runTask(worker, { file: state.inputFile, brightness: state.brightness, contrast: state.contrast, saturation: state.saturation, gamma: state.gamma, hue: state.hue, sharpness: state.sharpness }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') this.store.dispatch(ColorGradingActions.updateProgress({ progress: msg.value }));
          else if (msg.type === 'complete') this.store.dispatch(ColorGradingActions.processingSuccess({ outputBlob: new Blob([msg.data as BlobPart], { type: 'video/mp4' }) }));
        },
        error: (err) => this.store.dispatch(ColorGradingActions.processingFailure({ message: err.message }))
      });
    }
  }

  onDownload(state: ColorGradingState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const a = Object.assign(document.createElement('a'), { href: url, download: 'omni_graded.mp4' });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  onReset(): void {
    if (this.videoUrl) { URL.revokeObjectURL(this.videoUrl); this.videoUrl = null; }
    this.store.dispatch(ColorGradingActions.resetState());
  }
}