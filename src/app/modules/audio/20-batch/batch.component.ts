import { Component, ChangeDetectionStrategy, inject, OnDestroy, signal } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger } from '@angular/animations';
import { BatchActions, selectBatchState } from './batch.store';
import { BatchOperation } from './batch.schema';
import { BatchService } from './batch.service';
import { ExportFormat } from '../shared/types/audio.types';

@Component({
  selector: 'app-batch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, DecimalPipe],
  animations: [
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0 }), animate('400ms ease-out', style({ opacity: 1 }))])]),
    trigger('slideUp', [transition(':enter', [style({ opacity: 0, transform: 'translateY(20px)' }), animate('500ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0)' }))])]),
  ],
  template: `
    <div class="h-full w-full bg-[#0a0a0f] text-white p-6 flex flex-col overflow-y-auto" [@fadeIn]>
      <div class="flex justify-between items-center mb-8">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent tracking-tight">📦 Batch Processor</h2>
          <p class="text-gray-400 text-sm mt-1 uppercase tracking-widest">Apply one operation to many audio files at once</p>
        </div>
        @if ((state$ | async)?.files?.length) {
          <button (click)="onReset()" class="px-4 py-2 bg-gray-900 hover:bg-red-900/40 text-gray-400 hover:text-red-400 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors border border-gray-800">Clear All</button>
        }
      </div>

      @if (state$ | async; as state) {
        <!-- Controls -->
        <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 mb-6 flex flex-col md:flex-row gap-6" [@slideUp]>
          <!-- Operation -->
          <div class="flex-1">
            <label class="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Operation</label>
            <div class="grid grid-cols-2 gap-2">
              @for (op of operations; track op.id) {
                <button (click)="onSetOperation(op.id)" class="px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-left"
                        [class]="state.operation === op.id ? 'bg-orange-500/10 border-orange-500/40 text-orange-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600'">
                  {{ op.icon }} {{ op.label }}
                </button>
              }
            </div>
          </div>

          <!-- Format + Add Files -->
          <div class="flex flex-col gap-4">
            <div>
              <label class="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Output Format</label>
              <select [value]="state.outputFormat" (change)="onFormatChange($event)" class="bg-gray-900 border border-gray-700 text-white font-bold text-sm rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-colors">
                <option value="mp3">MP3</option>
                <option value="wav">WAV</option>
                <option value="aac">AAC</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Add Files</label>
              <label class="flex items-center gap-2 px-4 py-3 bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 text-orange-400 rounded-xl font-bold text-sm cursor-pointer transition-all active:scale-95">
                <input type="file" accept="audio/*" multiple class="hidden" (change)="onAddFiles($event)">
                ➕ Select Files
              </label>
            </div>
          </div>
        </div>

        <!-- File Queue -->
        @if (state.files.length > 0) {
          <div class="bg-[#12121a] rounded-2xl border border-gray-800 flex flex-col mb-6 overflow-hidden" [@slideUp]>
            <!-- Header -->
            <div class="grid grid-cols-[1fr_80px_80px_100px_40px] gap-4 px-5 py-3 border-b border-gray-800 text-[10px] font-black text-gray-500 uppercase tracking-widest">
              <span>File</span><span>Status</span><span>Progress</span><span>Output</span><span></span>
            </div>
            <!-- Rows -->
            <div class="overflow-y-auto max-h-64">
              @for (file of state.files; track file.id) {
                <div class="grid grid-cols-[1fr_80px_80px_100px_40px] gap-4 items-center px-5 py-3 border-b border-gray-900 hover:bg-gray-900/30 transition-colors">
                  <div class="min-w-0">
                    <p class="text-sm font-bold truncate" [title]="file.file.name">{{ file.file.name }}</p>
                    <p class="text-[10px] text-gray-500 font-mono">{{ (file.file.size / 1024 / 1024) | number:'1.2-2' }} MB</p>
                  </div>
                  <!-- Status Badge -->
                  <span class="text-[10px] font-bold px-2 py-1 rounded-lg border text-center"
                        [class]="file.status === 'done' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                               : file.status === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                               : file.status === 'processing' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                               : 'bg-gray-800 border-gray-700 text-gray-500'">
                    {{ file.status === 'done' ? '✅' : file.status === 'error' ? '❌' : file.status === 'processing' ? '⚙️' : '⏳' }}
                  </span>
                  <!-- Progress -->
                  <div class="flex items-center gap-1">
                    <div class="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div class="h-full bg-orange-500 transition-all rounded-full" [style.width.%]="file.progress"></div>
                    </div>
                    <span class="text-[10px] font-mono text-gray-500 w-7 text-right">{{ file.progress }}%</span>
                  </div>
                  <!-- Download -->
                  @if (file.outputBlob) {
                    <button (click)="downloadFile(file)" class="text-xs font-bold text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded-lg hover:bg-emerald-500/10 transition-colors">
                      ↓ {{ file.outputSizeMB | number:'1.1-1' }} MB
                    </button>
                  } @else {
                    <span class="text-[10px] text-gray-600">—</span>
                  }
                  <!-- Remove if queued -->
                  @if (file.status === 'queued') {
                    <button (click)="onRemoveFile(file.id)" class="text-gray-700 hover:text-rose-400 transition-colors text-sm">✕</button>
                  } @else {
                    <span></span>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Summary & Start -->
          <div class="flex items-center justify-between gap-4 flex-wrap">
            <div class="flex gap-6 text-sm">
              <span class="text-gray-400">Total: <span class="text-white font-bold">{{ state.files.length }}</span></span>
              <span class="text-emerald-400">Done: <span class="font-bold">{{ state.completedCount }}</span></span>
              <span class="text-rose-400">Errors: <span class="font-bold">{{ state.failedCount }}</span></span>
            </div>
            <button (click)="onStartBatch(state)" [disabled]="state.isRunning || state.files.every(f => f.status !== 'queued')"
                    class="px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-3"
                    [class]="state.isRunning ? 'bg-gray-800 text-orange-400' : 'bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 active:scale-95 shadow-[0_0_20px_rgba(249,115,22,0.2)]'">
              @if (state.isRunning) {
                <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                Processing...
              } @else { 📦 Start Batch }
            </button>
          </div>
        } @else {
          <!-- Empty State -->
          <div class="flex-1 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-800 rounded-2xl py-20 cursor-pointer hover:border-orange-500/30 transition-colors"
               (click)="fileInputMulti.click()">
            <div class="text-5xl mb-4">📦</div>
            <p class="text-xl font-black text-gray-400 mb-2">Drop multiple files here</p>
            <p class="text-sm text-gray-600">Click to select or use the button above</p>
            <input #fileInputMulti type="file" accept="audio/*" multiple class="hidden" (change)="onAddFiles($event)">
          </div>
        }
      }
    </div>
  `,
  styles: [`:host { display: block; height: 100%; }`]
})
export class BatchComponent implements OnDestroy {
  private store = inject(Store);
  private batchService = inject(BatchService);
  readonly state$ = this.store.select(selectBatchState);
  private cachedBlobUrls = new Map<Blob, string>();
  private isProcessing = false;

  readonly operations: { id: BatchOperation; label: string; icon: string }[] = [
    { id: 'convert', label: 'Convert Format', icon: '🔄' },
    { id: 'normalize', label: 'Normalize (-14 LUFS)', icon: '📊' },
    { id: 'compress', label: 'Compress', icon: '🗜️' },
    { id: 'trim-silence', label: 'Trim Silence', icon: '✂️' },
  ];

  onAddFiles(e: Event) {
    const files = Array.from((e.target as HTMLInputElement).files ?? []);
    if (files.length) this.store.dispatch(BatchActions.addFiles({ files }));
  }

  onSetOperation(operation: BatchOperation) { this.store.dispatch(BatchActions.setOperation({ operation })); }
  onFormatChange(e: Event) { this.store.dispatch(BatchActions.setFormat({ format: (e.target as HTMLSelectElement).value as ExportFormat })); }
  onRemoveFile(id: string) { this.store.dispatch(BatchActions.removeFile({ id })); }

  async onStartBatch(state: any) {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.store.dispatch(BatchActions.startBatch());

    const queuedFiles = state.files.filter((f: any) => f.status === 'queued');

    for (const fileState of queuedFiles) {
      this.store.dispatch(BatchActions.fileProcessingStarted({ id: fileState.id }));

      await new Promise<void>(resolve => {
        this.batchService.processSingleFile(fileState.file, state.operation, state.outputFormat).subscribe({
          next: event => {
            if (event.type === 'progress') {
              this.store.dispatch(BatchActions.fileProgress({ id: fileState.id, value: event.value || 0 }));
            } else if (event.type === 'complete' && event.data) {
              this.store.dispatch(BatchActions.fileSuccess({ id: fileState.id, blob: event.data.blob, sizeMB: event.data.sizeMB }));
            }
          },
          error: err => {
            this.store.dispatch(BatchActions.fileFailure({ id: fileState.id, error: err.message || 'Error' }));
            resolve();
          },
          complete: () => resolve()
        });
      });
    }

    this.store.dispatch(BatchActions.batchComplete());
    this.isProcessing = false;
  }

  downloadFile(file: any) {
    if (!file.outputBlob) return;
    if (!this.cachedBlobUrls.has(file.outputBlob)) {
      this.cachedBlobUrls.set(file.outputBlob, URL.createObjectURL(file.outputBlob));
    }
    const a = document.createElement('a');
    a.href = this.cachedBlobUrls.get(file.outputBlob)!;
    a.download = `omni_batch_${file.file.name}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  onReset() {
    this.cachedBlobUrls.forEach(url => URL.revokeObjectURL(url));
    this.cachedBlobUrls.clear();
    this.store.dispatch(BatchActions.resetState());
  }

  ngOnDestroy() { this.onReset(); }
}
