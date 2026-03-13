import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';

type BatchOp = 'compress'|'convert'|'extract-audio'|'thumbnail';
interface BatchJob { id: string; file: File; status: 'queued'|'processing'|'done'|'error'; progress: number; }
interface BatchState { status: 'idle'|'processing'|'done'; jobs: BatchJob[]; operation: BatchOp; }
const initialState: BatchState = { status: 'idle', jobs: [], operation: 'compress' };

const BatchActions = createActionGroup({ source: 'Batch', events: {
  'Add Files': props<{ files: File[] }>(),
  'Remove Job': props<{ id: string }>(),
  'Set Operation': props<{ operation: BatchOp }>(),
  'Start Batch': emptyProps(),
  'Update Job': props<{ id: string; status: BatchJob['status']; progress: number }>(),
  'Batch Done': emptyProps(),
  'Reset State': emptyProps(),
}});

const batchFeature = createFeature({ name: 'batch', reducer: createReducer(initialState,
  on(BatchActions.addFiles, (s, { files }) => ({ ...s, jobs: [...s.jobs, ...files.map(f => ({ id: crypto.randomUUID(), file: f, status: 'queued' as const, progress: 0 }))] })),
  on(BatchActions.removeJob, (s, { id }) => ({ ...s, jobs: s.jobs.filter(j => j.id !== id) })),
  on(BatchActions.setOperation, (s, { operation }) => ({ ...s, operation })),
  on(BatchActions.startBatch, (s) => ({ ...s, status: 'processing' })),
  on(BatchActions.updateJob, (s, { id, status, progress }) => ({ ...s, jobs: s.jobs.map(j => j.id === id ? { ...j, status, progress } : j) })),
  on(BatchActions.batchDone, (s) => ({ ...s, status: 'done' })),
  on(BatchActions.resetState, () => initialState),
)});

const BATCH_OPS: { value: BatchOp; label: string; icon: string; desc: string }[] = [
  { value: 'compress', label: 'Compress All', icon: '📦', desc: 'Reduce file size with CRF 28' },
  { value: 'convert', label: 'Convert to MP4', icon: '🔄', desc: 'Convert all files to H.264 MP4' },
  { value: 'extract-audio', label: 'Extract Audio', icon: '🎵', desc: 'Extract audio track from each video' },
  { value: 'thumbnail', label: 'Get Thumbnails', icon: '🖼', desc: 'Extract thumbnail frame from each video' },
];

@Component({
  selector: 'app-batch',
  standalone: true,
  imports: [AsyncPipe, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent pb-1">Batch Processor</h2>
        <p class="text-gray-400 text-sm mt-1">Apply the same operation to multiple videos simultaneously using queued Web Workers.</p>
      </div>

      @if (vm$ | async; as vm) {
        <div class="flex flex-col lg:flex-row gap-6">
          <div class="flex-1 flex flex-col gap-4">
            <!-- File Add -->
            <label class="border-2 border-dashed border-gray-600 hover:border-cyan-400 rounded-xl p-6 flex items-center gap-4 cursor-pointer transition-all">
              <div class="w-12 h-12 rounded-full bg-cyan-900/30 flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
              </div>
              <div><p class="text-white font-medium">Add Multiple Videos</p><p class="text-xs text-gray-500">Select multiple files at once</p></div>
              <input type="file" accept="video/*" multiple class="hidden" (change)="onFilesAdded($event)">
            </label>
            <!-- Job List -->
            @if (vm.jobs.length > 0) {
              <div class="flex flex-col gap-2 max-h-80 overflow-y-auto">
                @for (job of vm.jobs; track job.id) {
                  <div class="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl p-3">
                    <div [class]="getJobStatusClass(job.status)" class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">
                      @if (job.status === 'done') { ✓ }
                      @if (job.status === 'error') { ✕ }
                      @if (job.status === 'queued') { ○ }
                      @if (job.status === 'processing') { ◌ }
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-white text-xs font-medium truncate">{{ job.file.name }}</p>
                      @if (job.status === 'processing') {
                        <div class="w-full bg-gray-700 rounded-full h-1 mt-1">
                          <div class="bg-cyan-500 h-1 rounded-full transition-all" [style.width.%]="job.progress"></div>
                        </div>
                      }
                    </div>
                    <span class="text-xs text-gray-500">{{ (job.file.size / 1024 / 1024).toFixed(1) }}MB</span>
                    @if (job.status !== 'processing') {
                      <button (click)="removeJob(job.id)" class="text-gray-500 hover:text-red-400 p-1">✕</button>
                    }
                  </div>
                }
              </div>
            } @else {
              <div class="flex-1 flex items-center justify-center text-gray-600">
                <p>Add videos to batch process</p>
              </div>
            }
          </div>

          <div class="w-full lg:w-72 flex flex-col gap-4">
            <!-- Operations -->
            <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <label class="block text-sm font-semibold text-gray-300 mb-3">Batch Operation</label>
              @for (op of batchOps; track op.value) {
                <button (click)="setOp(op.value)"
                  [class]="vm.operation === op.value ? 'bg-cyan-700 border-cyan-500' : 'border-gray-700 hover:border-gray-500'"
                  class="w-full mb-2 p-3 text-left rounded-lg border transition-all flex items-center gap-3">
                  <span class="text-xl">{{ op.icon }}</span>
                  <div>
                    <div class="text-white text-sm font-medium">{{ op.label }}</div>
                    <div class="text-xs text-gray-400">{{ op.desc }}</div>
                  </div>
                </button>
              }
            </div>
            <!-- Stats -->
            @if (vm.jobs.length > 0) {
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div class="grid grid-cols-3 text-center gap-2">
                  <div><p class="text-2xl font-bold text-white">{{ vm.jobs.length }}</p><p class="text-xs text-gray-400">Total</p></div>
                  <div><p class="text-2xl font-bold text-green-400">{{ getDoneCount(vm) }}</p><p class="text-xs text-gray-400">Done</p></div>
                  <div><p class="text-2xl font-bold text-cyan-400">{{ vm.jobs.length - getDoneCount(vm) }}</p><p class="text-xs text-gray-400">Pending</p></div>
                </div>
              </div>
            }

            @if (vm.status === 'processing') {
              <div class="bg-gray-800 rounded-xl p-6 flex flex-col items-center">
                <div class="w-full bg-gray-700 rounded-full h-2 mb-3">
                  <div class="bg-cyan-500 h-2 rounded-full transition-all" [style.width.%]="getDoneCount(vm) / vm.jobs.length * 100"></div>
                </div>
                <p class="text-gray-300 text-sm">{{ getDoneCount(vm) }}/{{ vm.jobs.length }} completed</p>
              </div>
            } @else if (vm.status === 'done') {
              <div class="text-center py-4">
                <div class="text-4xl mb-2">✅</div>
                <p class="text-green-400 font-bold">Batch Complete!</p>
                <p class="text-xs text-gray-400">{{ vm.jobs.length }} files processed</p>
              </div>
              <button (click)="onReset()" class="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl text-sm">Start New Batch</button>
            } @else {
              <button (click)="onStartBatch(vm)" [disabled]="vm.jobs.length === 0"
                class="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all active:scale-95 disabled:opacity-50">
                ⚡ Start Batch ({{ vm.jobs.length }} files)
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BatchComponent {
  private store = inject(Store);
  private workerBridge = inject(WorkerBridgeService);
  readonly vm$ = this.store.select(batchFeature.selectBatchState);
  readonly batchOps = BATCH_OPS;

  getDoneCount(vm: BatchState): number { return vm.jobs.filter(j => j.status === 'done').length; }

  getJobStatusClass(status: BatchJob['status']): string {
    const m: Record<string, string> = { queued: 'bg-gray-600', processing: 'bg-cyan-600 animate-pulse', done: 'bg-green-600', error: 'bg-red-600' };
    return m[status];
  }

  onFilesAdded(e: Event): void { const files = Array.from((e.target as HTMLInputElement).files ?? []); if (files.length) this.store.dispatch(BatchActions.addFiles({ files })); }
  removeJob(id: string): void { this.store.dispatch(BatchActions.removeJob({ id })); }
  setOp(operation: BatchOp): void { this.store.dispatch(BatchActions.setOperation({ operation })); }

  async onStartBatch(state: BatchState): Promise<void> {
    this.store.dispatch(BatchActions.startBatch());
    for (const job of state.jobs) {
      this.store.dispatch(BatchActions.updateJob({ id: job.id, status: 'processing', progress: 0 }));
      const worker = new Worker(new URL('./batch.worker', import.meta.url), { type: 'module' });
      await new Promise<void>((resolve) => {
        this.workerBridge.runTask(worker, { file: job.file, operation: state.operation }).subscribe({
          next: (msg) => {
            if (msg.type === 'progress') this.store.dispatch(BatchActions.updateJob({ id: job.id, status: 'processing', progress: msg.value }));
            else if (msg.type === 'complete') { this.store.dispatch(BatchActions.updateJob({ id: job.id, status: 'done', progress: 100 })); resolve(); }
          },
          error: () => { this.store.dispatch(BatchActions.updateJob({ id: job.id, status: 'error', progress: 0 })); resolve(); }
        });
      });
    }
    this.store.dispatch(BatchActions.batchDone());
  }

  onReset(): void { this.store.dispatch(BatchActions.resetState()); }
}