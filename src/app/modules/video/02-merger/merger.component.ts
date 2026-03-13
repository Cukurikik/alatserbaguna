import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { MergerActions, selectMergerState } from './merger.store';
import { MergerService } from './merger.service';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { ExportPanelComponent } from '../shared/components/export-panel/export-panel.component';

@Component({
  selector: 'app-merger',
  standalone: true,
  imports: [CommonModule, ProgressRingComponent, ExportPanelComponent],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-sm pb-1">Video Merger</h2>
        <p class="text-gray-400 text-sm mt-1">Concatenate multiple video clips into a single seamless output using FFmpeg concat protocol.</p>
      </div>

      @if ((state$ | async) as state) {

        <!-- File Drop Area -->
        <div class="relative border-2 border-dashed border-gray-600 hover:border-purple-400 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 bg-gray-800 bg-opacity-50 hover:shadow-[0_0_15px_rgba(192,132,252,0.3)] mb-6"
             (click)="fileInput.click()"
             (dragover)="$event.preventDefault()"
             (drop)="onDrop($event)">
          <div class="w-16 h-16 rounded-full bg-purple-900/40 flex items-center justify-center mb-4">
            <svg class="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
          </div>
          <span class="text-white font-medium text-lg">Add video files to merge</span>
          <span class="text-gray-400 text-sm mt-2">Drag & drop or click to browse. Supports MP4, WebM, MOV</span>
          <input #fileInput type="file" accept="video/*" multiple class="hidden" (change)="onFilesSelected($event)">
        </div>

        <!-- File List -->
        @if (state.inputFiles.length > 0) {
          <div class="flex flex-col gap-3 mb-6">
            <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-widest">Merge Order ({{ state.inputFiles.length }} files)</h3>
            @for (file of state.inputFiles; track file.name; let i = $index) {
              <div class="flex items-center gap-4 bg-gray-800 border border-gray-700 rounded-xl p-4 group hover:border-purple-500 transition-colors">
                <div class="w-8 h-8 rounded-lg bg-purple-900/40 flex items-center justify-center text-purple-300 font-bold text-sm flex-shrink-0">{{ i + 1 }}</div>
                <div class="flex-1 min-w-0">
                  <p class="text-white font-medium truncate">{{ file.name }}</p>
                  <p class="text-gray-500 text-xs mt-0.5">{{ (file.size / 1024 / 1024).toFixed(2) }} MB</p>
                </div>
                <!-- Move buttons -->
                <div class="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button (click)="moveUp(i)" [disabled]="i === 0"
                    class="text-gray-400 hover:text-white disabled:opacity-30 p-1 rounded transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>
                  </button>
                  <button (click)="moveDown(i)" [disabled]="i === state.inputFiles.length - 1"
                    class="text-gray-400 hover:text-white disabled:opacity-30 p-1 rounded transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                  </button>
                </div>
                <button (click)="removeFile(i)"
                  class="text-gray-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-900/20 opacity-0 group-hover:opacity-100">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            }
          </div>
        }

        <!-- Export Panel + Status -->
        <div class="flex flex-col lg:flex-row gap-6">
          <div class="flex-1">
            <app-export-panel
              [disabled]="state.status === 'processing' || state.inputFiles.length < 2"
              (formatChange)="onFormatSelected($event)"
              (exportClicked)="onStartMerge()">
            </app-export-panel>
            @if (state.inputFiles.length < 2 && state.inputFiles.length > 0) {
              <p class="text-yellow-400 text-xs mt-2 px-1">Add at least 2 videos to merge.</p>
            }
          </div>

          @if (state.status === 'processing') {
            <div class="w-full lg:w-80 bg-gray-800 rounded-xl p-8 border border-gray-700 flex flex-col items-center justify-center shadow-xl">
              <app-progress-ring [progress]="state.progress" [status]="'Merging...'"></app-progress-ring>
              <p class="text-gray-400 text-sm mt-4 text-center">Concatenating clips via FFmpeg concat protocol...</p>
            </div>
          }

          @if (state.status === 'success') {
            <div class="w-full lg:w-80 bg-gradient-to-br from-green-900/40 to-emerald-900/20 border border-green-800 rounded-xl p-6 flex flex-col items-center justify-center shadow-xl">
              <div class="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              </div>
              <h3 class="text-lg font-bold text-white mb-2">Merge Complete!</h3>
              <button class="mt-2 w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                (click)="onDownload()">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                Download Merged Video
              </button>
              <button class="mt-4 text-sm text-gray-400 hover:text-white transition-colors" (click)="onReset()">Start Over</button>
            </div>
          }

          @if (state.status === 'error') {
            <div class="w-full lg:w-80 bg-red-900/20 border border-red-800 rounded-xl p-6 flex flex-col items-center justify-center">
              <svg class="w-10 h-10 text-red-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
              <p class="text-red-300 text-sm text-center">{{ state.errorMessage }}</p>
              <button class="mt-4 text-sm text-gray-400 hover:text-white" (click)="onReset()">Try Again</button>
            </div>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MergerComponent {
  private store = inject(Store);
  private mergerService = inject(MergerService);
  state$ = this.store.select(selectMergerState);

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.store.dispatch(MergerActions.addFiles({ files: Array.from(input.files) }));
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const files = Array.from(event.dataTransfer?.files ?? []).filter(f => f.type.startsWith('video/'));
    if (files.length) {
      this.store.dispatch(MergerActions.addFiles({ files }));
    }
  }

  removeFile(index: number): void {
    this.store.dispatch(MergerActions.removeFile({ index }));
  }

  moveUp(index: number): void {
    if (index > 0) {
      this.store.dispatch(MergerActions.reorderFiles({ from: index, to: index - 1 }));
    }
  }

  moveDown(index: number): void {
    this.store.dispatch(MergerActions.reorderFiles({ from: index, to: index + 1 }));
  }

  onFormatSelected(format: string): void {
    this.store.dispatch(MergerActions.setOutputFormat({ format }));
  }

  onStartMerge(): void {
    this.store.dispatch(MergerActions.startProcessing());
    this.state$.subscribe(state => {
      if (state.status === 'processing' && state.inputFiles.length >= 2) {
        this.mergerService.process(state.inputFiles, state.outputFormat).subscribe({
          next: (msg) => {
            if (msg.type === 'progress') {
              this.store.dispatch(MergerActions.updateProgress({ progress: msg.value ?? 0 }));
            } else if (msg.type === 'complete') {
              const blob = new Blob([msg.data as BlobPart], { type: `video/${state.outputFormat}` });
              this.store.dispatch(MergerActions.processingSuccess({ outputBlob: blob }));
            }
          },
          error: (err) => {
            this.store.dispatch(MergerActions.processingFailure({ message: err.message ?? 'Unknown error' }));
          }
        });
      }
    }).unsubscribe();
  }

  onDownload(): void {
    this.store.select(selectMergerState).subscribe(state => {
      if (state.outputBlob) {
        const url = URL.createObjectURL(state.outputBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `omni_merged.${state.outputFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 150);
      }
    }).unsubscribe();
  }

  onReset(): void {
    this.store.dispatch(MergerActions.resetState());
  }
}