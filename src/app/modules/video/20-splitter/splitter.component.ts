import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';

interface SplitSegment { index: number; start: number; end: number; url: string | null; }
interface SplitterState { status: 'idle'|'processing'|'success'|'error'; progress: number; inputFile: File|null; segments: SplitSegment[]; splitCount: number; outputBlobs: Blob[]; duration: number; }
const initialState: SplitterState = { status: 'idle', progress: 0, inputFile: null, segments: [], splitCount: 3, outputBlobs: [], duration: 60 };

const SplitterActions = createActionGroup({ source: 'Splitter', events: {
  'Load File': props<{ file: File }>(),
  'Set Duration': props<{ duration: number }>(),
  'Set Split Count': props<{ splitCount: number }>(),
  'Start Processing': emptyProps(),
  'Update Progress': props<{ progress: number }>(),
  'Processing Success': props<{ blobs: Blob[] }>(),
  'Processing Failure': props<{ message: string }>(),
  'Reset State': emptyProps(),
}});

const splitterFeature = createFeature({ name: 'splitter', reducer: createReducer(initialState,
  on(SplitterActions.loadFile, (s, { file }) => ({ ...s, inputFile: file })),
  on(SplitterActions.setDuration, (s, { duration }) => {
    const segs = buildSegments(s.splitCount, duration);
    return { ...s, duration, segments: segs };
  }),
  on(SplitterActions.setSplitCount, (s, { splitCount }) => {
    const segs = buildSegments(splitCount, s.duration);
    return { ...s, splitCount, segments: segs };
  }),
  on(SplitterActions.startProcessing, (s) => ({ ...s, status: 'processing', progress: 0, outputBlobs: [] })),
  on(SplitterActions.updateProgress, (s, { progress }) => ({ ...s, progress })),
  on(SplitterActions.processingSuccess, (s, { blobs }) => ({ ...s, status: 'success', outputBlobs: blobs, progress: 100 })),
  on(SplitterActions.processingFailure, (s) => ({ ...s, status: 'error' })),
  on(SplitterActions.resetState, () => initialState),
)});

function buildSegments(count: number, duration: number): SplitSegment[] {
  const segLen = duration / count;
  return Array.from({ length: count }, (_, i) => ({ index: i, start: Math.round(i * segLen), end: Math.round((i + 1) * segLen), url: null }));
}

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

@Component({
  selector: 'app-splitter',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent pb-1">Video Splitter</h2>
        <p class="text-gray-400 text-sm mt-1">Split video into N equal segments using FFmpeg segment muxer (no re-encoding).</p>
      </div>

      @if (vm$ | async; as vm) {
        @if (!vm.inputFile) {
          <div class="flex-1 flex flex-col justify-center">
            <app-file-drop-zone accept="video/*" (fileDropped)="onFile($event)"></app-file-drop-zone>
          </div>
        } @else {
          <div class="flex flex-col lg:flex-row gap-6">
            <div class="flex-1 flex flex-col gap-4">
              <app-video-preview [videoUrl]="videoUrl" (durationLoaded)="onDuration($event, vm)"></app-video-preview>
              <!-- Segment timeline -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <h3 class="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Segment Timeline</h3>
                <div class="flex gap-1 h-8">
                  @for (seg of vm.segments; track seg.index) {
                    <div [style.flex]="1" class="rounded flex items-center justify-center text-xs font-bold text-white" [class]="getSegColor(seg.index)">
                      {{ seg.index + 1 }}
                    </div>
                  }
                </div>
                <div class="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0:00</span>
                  <span>{{ fmtTime(vm.duration) }}</span>
                </div>
              </div>
              <!-- Segment List -->
              @if (vm.status === 'success') {
                <div class="flex flex-col gap-2">
                  @for (blob of vm.outputBlobs; track $index; let i = $index) {
                    <div class="flex items-center gap-3 bg-gray-800 rounded-xl p-3 border border-gray-700">
                      <div [class]="getSegColor(i)" class="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{{ i + 1 }}</div>
                      <div class="flex-1">
                        <p class="text-white text-sm font-medium">Segment {{ i + 1 }}</p>
                        <p class="text-gray-400 text-xs">{{ fmtTime(vm.segments[i]?.start ?? 0) }} → {{ fmtTime(vm.segments[i]?.end ?? 0) }}</p>
                      </div>
                      <button (click)="downloadBlob(blob, i)" class="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded-lg transition-all">⬇ Download</button>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="w-full lg:w-72 flex flex-col gap-4">
              <!-- Split Count -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-5">
                <div class="flex justify-between mb-3">
                  <label class="text-sm font-semibold text-gray-300">Number of Segments</label>
                  <span class="text-red-400 font-mono font-bold text-2xl">{{ vm.splitCount }}</span>
                </div>
                <input type="range" min="2" max="20" [value]="vm.splitCount" (input)="setSplitCount($event, vm)" class="w-full accent-red-400">
                <p class="text-xs text-gray-500 mt-2 text-center">≈ {{ Math.round(vm.duration / vm.splitCount) }}s per segment</p>
              </div>
              <!-- Segment Duration Summary -->
              <div class="bg-gray-950 rounded-xl p-4 border border-gray-700">
                <p class="text-xs text-gray-500 mb-2 uppercase tracking-wider">FFmpeg Command</p>
                <p class="font-mono text-xs text-red-300">-f segment -segment_time {{ Math.round(vm.duration / vm.splitCount) }} -reset_timestamps 1 -c copy output%03d.mp4</p>
              </div>

              @if (vm.status === 'processing') {
                <div class="bg-gray-800 rounded-xl p-6 flex flex-col items-center"><app-progress-ring [progress]="vm.progress" [status]="'Splitting video...'"></app-progress-ring></div>
              } @else if (vm.status === 'success') {
                <button (click)="downloadAll(vm)" class="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold">⬇ Download All Segments</button>
                <button (click)="onReset()" class="text-sm text-center text-gray-400 hover:text-white">Try Another</button>
              } @else {
                <button (click)="onProcess(vm)" class="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all active:scale-95">
                  ✂️ Split into {{ vm.splitCount }} Segments
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
export class SplitterComponent {
  private store = inject(Store);
  private workerBridge = inject(WorkerBridgeService);
  readonly vm$ = this.store.select(splitterFeature.selectSplitterState);
  videoUrl: string | null = null;
  readonly Math = Math;
  readonly fmtTime = fmtTime;

  private segColors = ['bg-red-600','bg-orange-600','bg-yellow-600','bg-green-600','bg-teal-600','bg-cyan-600','bg-blue-600','bg-indigo-600','bg-violet-600','bg-pink-600'];
  getSegColor(i: number): string { return this.segColors[i % this.segColors.length]; }

  onFile(file: File): void { if (this.videoUrl) URL.revokeObjectURL(this.videoUrl); this.videoUrl = URL.createObjectURL(file); this.store.dispatch(SplitterActions.loadFile({ file })); }
  onDuration(duration: number, vm: SplitterState): void { this.store.dispatch(SplitterActions.setDuration({ duration: Math.floor(duration) })); }
  setSplitCount(e: Event, vm: SplitterState): void { this.store.dispatch(SplitterActions.setSplitCount({ splitCount: +(e.target as HTMLInputElement).value })); }

  onProcess(state: SplitterState): void {
    this.store.dispatch(SplitterActions.startProcessing());
    if (state.inputFile) {
      const worker = new Worker(new URL('./splitter.worker', import.meta.url), { type: 'module' });
      this.workerBridge.runTask(worker, { file: state.inputFile, segments: state.segments }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') this.store.dispatch(SplitterActions.updateProgress({ progress: msg.value }));
          else if (msg.type === 'complete') {
            const blobs = Array.from({ length: state.splitCount }, () => new Blob([msg.data as BlobPart ?? new ArrayBuffer(0)], { type: 'video/mp4' }));
            this.store.dispatch(SplitterActions.processingSuccess({ blobs }));
          }
        },
        error: (err) => this.store.dispatch(SplitterActions.processingFailure({ message: err.message }))
      });
    }
  }

  downloadBlob(blob: Blob, index: number): void {
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: `omni_segment_${index + 1}.mp4` });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 150);
  }

  downloadAll(state: SplitterState): void { state.outputBlobs.forEach((b, i) => this.downloadBlob(b, i)); }

  onReset(): void { if (this.videoUrl) { URL.revokeObjectURL(this.videoUrl); this.videoUrl = null; } this.store.dispatch(SplitterActions.resetState()); }
}