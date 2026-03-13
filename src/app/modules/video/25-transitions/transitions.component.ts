import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';

type Transition = 'fade'|'wipeleft'|'wiperight'|'slideleft'|'slideright'|'dissolve'|'circleopen'|'circlecrop';
interface TransitionsState { status: 'idle'|'processing'|'success'|'error'; progress: number; inputFiles: File[]; outputBlob: Blob|null; transition: Transition; duration: number; }
const initialState: TransitionsState = { status: 'idle', progress: 0, inputFiles: [], outputBlob: null, transition: 'fade', duration: 1 };

const TransitionsActions = createActionGroup({ source: 'Transitions', events: {
  'Add Files': props<{ files: File[] }>(),
  'Remove File': props<{ index: number }>(),
  'Set Transition': props<{ transition: Transition }>(),
  'Set Duration': props<{ duration: number }>(),
  'Start Processing': emptyProps(),
  'Update Progress': props<{ progress: number }>(),
  'Processing Success': props<{ outputBlob: Blob }>(),
  'Processing Failure': props<{ message: string }>(),
  'Reset State': emptyProps(),
}});

const transitionsFeature = createFeature({ name: 'transitions', reducer: createReducer(initialState,
  on(TransitionsActions.addFiles, (s, { files }) => ({ ...s, inputFiles: [...s.inputFiles, ...files] })),
  on(TransitionsActions.removeFile, (s, { index }) => ({ ...s, inputFiles: s.inputFiles.filter((_, i) => i !== index) })),
  on(TransitionsActions.setTransition, (s, { transition }) => ({ ...s, transition })),
  on(TransitionsActions.setDuration, (s, { duration }) => ({ ...s, duration })),
  on(TransitionsActions.startProcessing, (s) => ({ ...s, status: 'processing', progress: 0 })),
  on(TransitionsActions.updateProgress, (s, { progress }) => ({ ...s, progress })),
  on(TransitionsActions.processingSuccess, (s, { outputBlob }) => ({ ...s, status: 'success', outputBlob, progress: 100 })),
  on(TransitionsActions.processingFailure, (s) => ({ ...s, status: 'error' })),
  on(TransitionsActions.resetState, () => initialState),
)});

const TRANSITIONS: { value: Transition; label: string; icon: string }[] = [
  { value: 'fade', label: 'Fade', icon: '🌅' },
  { value: 'wipeleft', label: 'Wipe Left', icon: '◀' },
  { value: 'wiperight', label: 'Wipe Right', icon: '▶' },
  { value: 'slideleft', label: 'Slide Left', icon: '←' },
  { value: 'slideright', label: 'Slide Right', icon: '→' },
  { value: 'dissolve', label: 'Dissolve', icon: '✦' },
  { value: 'circleopen', label: 'Circle Open', icon: '◉' },
  { value: 'circlecrop', label: 'Circle Crop', icon: '⊙' },
];

@Component({
  selector: 'app-transitions',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent pb-1">Video Transitions</h2>
        <p class="text-gray-400 text-sm mt-1">Join clips with cinematic transitions using FFmpeg xfade filter. 8 transition types available.</p>
      </div>

      @if (vm$ | async; as vm) {
        <div class="flex flex-col lg:flex-row gap-6">
          <div class="flex-1 flex flex-col gap-4">
            <app-file-drop-zone accept="video/*" (fileDropped)="onFileAdded($event)"></app-file-drop-zone>
            @if (vm.inputFiles.length > 0) {
              <div class="flex flex-col gap-2">
                @for (file of vm.inputFiles; track file.name; let i = $index) {
                  <div class="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl p-3">
                    <div class="text-purple-400 font-bold text-sm w-6">{{ i + 1 }}</div>
                    @if (i < vm.inputFiles.length - 1) {
                      <div class="w-8 h-8 rounded-full bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                        <span class="text-purple-400 text-xs">{{ getTransitionIcon(vm.transition) }}</span>
                      </div>
                    }
                    <div class="flex-1 min-w-0">
                      <p class="text-white text-sm font-medium truncate">{{ file.name }}</p>
                      <p class="text-xs text-gray-500">{{ (file.size / 1024 / 1024).toFixed(2) }} MB</p>
                    </div>
                    <button (click)="removeFile(i)" class="text-gray-500 hover:text-red-400 transition-colors p-1">✕</button>
                  </div>
                }
              </div>
            }
          </div>

          <div class="w-full lg:w-80 flex flex-col gap-4">
            <!-- Transition selector -->
            <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <label class="block text-sm font-semibold text-gray-300 mb-3">Transition Effect</label>
              <div class="grid grid-cols-2 gap-2">
                @for (t of transitions; track t.value) {
                  <button (click)="setTransition(t.value)"
                    [class]="vm.transition === t.value ? 'bg-purple-600 text-white border-purple-500' : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-400'"
                    class="border py-2 px-3 rounded-lg text-xs transition-all flex items-center gap-2">
                    <span>{{ t.icon }}</span><span>{{ t.label }}</span>
                  </button>
                }
              </div>
            </div>
            <!-- Duration -->
            <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div class="flex justify-between mb-2"><label class="text-sm font-semibold text-gray-300">Transition Duration</label><span class="text-purple-400 font-mono">{{ vm.duration }}s</span></div>
              <input type="range" min="0.25" max="3" step="0.25" [value]="vm.duration" (input)="setDuration($event)" class="w-full accent-purple-400">
            </div>
            <!-- FFmpeg preview -->
            <div class="bg-gray-950 rounded-xl p-3 font-mono text-xs text-purple-300 break-all">
              xfade=transition={{ vm.transition }}:duration={{ vm.duration }}:offset=[clip_end-{{ vm.duration }}]
            </div>

            @if (vm.status === 'processing') {
              <div class="bg-gray-800 rounded-xl p-6 flex flex-col items-center"><app-progress-ring [progress]="vm.progress" [status]="'Rendering transitions...'"></app-progress-ring></div>
            } @else if (vm.status === 'success') {
              <button (click)="onDownload(vm)" class="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-bold">⬇ Download with Transitions</button>
              <button (click)="onReset()" class="text-sm text-center text-gray-400 hover:text-white">Try Another</button>
            } @else {
              <button (click)="onProcess(vm)" [disabled]="vm.inputFiles.length < 2"
                class="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all active:scale-95 disabled:opacity-50">
                🎬 Render with Transitions
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransitionsComponent {
  private store = inject(Store);
  private workerBridge = inject(WorkerBridgeService);
  readonly vm$ = this.store.select(transitionsFeature.selectTransitionsState);
  readonly transitions = TRANSITIONS;

  getTransitionIcon(t: Transition): string { return TRANSITIONS.find(x => x.value === t)?.icon ?? '✦'; }
  setTransition(transition: Transition): void { this.store.dispatch(TransitionsActions.setTransition({ transition })); }
  setDuration(e: Event): void { this.store.dispatch(TransitionsActions.setDuration({ duration: +(e.target as HTMLInputElement).value })); }
  removeFile(index: number): void { this.store.dispatch(TransitionsActions.removeFile({ index })); }
  onFileAdded(file: File): void { this.store.dispatch(TransitionsActions.addFiles({ files: [file] })); }

  onProcess(state: TransitionsState): void {
    this.store.dispatch(TransitionsActions.startProcessing());
    if (state.inputFiles.length >= 2) {
      const worker = new Worker(new URL('./transitions.worker', import.meta.url), { type: 'module' });
      this.workerBridge.runTask(worker, state).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') this.store.dispatch(TransitionsActions.updateProgress({ progress: msg.value }));
          else if (msg.type === 'complete') this.store.dispatch(TransitionsActions.processingSuccess({ outputBlob: new Blob([msg.data as BlobPart ?? new ArrayBuffer(0)], { type: 'video/mp4' }) }));
        },
        error: (err) => this.store.dispatch(TransitionsActions.processingFailure({ message: err.message }))
      });
    }
  }

  onDownload(state: TransitionsState): void {
    if (state.outputBlob) { const url = URL.createObjectURL(state.outputBlob); const a = Object.assign(document.createElement('a'), { href: url, download: 'omni_transitions.mp4' }); document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 150); }
  }

  onReset(): void { this.store.dispatch(TransitionsActions.resetState()); }
}