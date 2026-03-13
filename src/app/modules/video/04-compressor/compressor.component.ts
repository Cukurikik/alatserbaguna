import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { CompressorActions, selectCompressorState, CompressorState } from './compressor.store';
import { CompressorService } from './compressor.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';

const PRESETS = ['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'veryslow'];

@Component({
  selector: 'app-compressor',
  standalone: true,
  imports: [CommonModule, AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-green-400 to-teal-300 bg-clip-text text-transparent pb-1">Video Compressor</h2>
        <p class="text-gray-400 text-sm mt-1">Reduce file size with precision CRF control using H.264/H.265 encoding.</p>
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
              <app-video-preview [videoUrl]="videoUrl"></app-video-preview>

              <!-- Size comparison -->
              <ng-container *ngIf="vm.status === 'success'">
                <div class="mt-4 bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center justify-around">
                  <div class="text-center">
                    <p class="text-xs text-gray-500 uppercase mb-1">Original</p>
                    <p class="text-2xl font-bold text-white">{{ vm.originalSizeMB.toFixed(1) }}<span class="text-sm text-gray-400"> MB</span></p>
                  </div>
                  <div class="text-green-400">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                  </div>
                  <div class="text-center">
                    <p class="text-xs text-gray-500 uppercase mb-1">Compressed</p>
                    <p class="text-2xl font-bold text-green-400">{{ vm.outputSizeMB.toFixed(1) }}<span class="text-sm text-gray-400"> MB</span></p>
                  </div>
                </div>
              </ng-container>
            </div>

            <div class="w-full lg:w-96 flex flex-col gap-4">
              <!-- CRF Slider -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-5">
                <div class="flex justify-between items-center mb-3">
                  <label class="text-sm font-semibold text-gray-300">Compression Level (CRF)</label>
                  <span class="text-green-400 font-mono font-bold text-lg">{{ vm.crf }}</span>
                </div>
                <input type="range" min="18" max="51" [value]="vm.crf" (input)="setCRF($event)"
                  class="w-full accent-green-400">
                <div class="flex justify-between text-xs text-gray-500 mt-1 px-0.5">
                  <span class="text-green-400">18 = High Quality</span><span class="text-yellow-400">51 = Max Compress</span>
                </div>
              </div>

              <!-- Preset Selector -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-5">
                <label class="block text-sm font-semibold text-gray-300 mb-3">Encoding Preset</label>
                <div class="grid grid-cols-4 gap-1.5">
                  <ng-container *ngFor="let preset of presets">
                    <button (click)="setPreset(preset)"
                      [class]="vm.preset === preset ? 'bg-teal-600 text-white shadow-md' : 'bg-gray-900 text-gray-400 hover:bg-gray-700'"
                      class="py-1.5 px-1 rounded-lg text-xs font-mono transition-all text-center">
                      {{ preset }}
                    </button>
                  </ng-container>
                </div>
                <p class="text-xs text-gray-500 mt-2">Slower = smaller file. Faster = quicker processing.</p>
              </div>

              <ng-container *ngIf="vm.status === 'processing'">
                <div class="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col items-center">
                  <app-progress-ring [progress]="vm.progress" [status]="'Compressing...'"></app-progress-ring>
                </div>
              </ng-container>
              <ng-container *ngIf="vm.status === 'success'">
                <button (click)="onDownload(vm)" class="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(74,222,128,0.3)] flex items-center justify-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  Download Compressed
                </button>
                <button (click)="onReset()" class="text-sm text-center text-gray-400 hover:text-white">Compress Another</button>
              </ng-container>
              <ng-container *ngIf="vm.status === 'idle' || vm.status === 'error'">
                <button (click)="onCompress(vm)" [disabled]="!vm.inputFile"
                  class="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-400 hover:to-teal-400 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(74,222,128,0.4)] transition-all active:scale-95 disabled:opacity-50">
                  Start Compression
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
export class CompressorComponent {
  private store = inject(Store);
  private compressorService = inject(CompressorService);
  readonly vm$ = this.store.select(selectCompressorState);
  videoUrl: string | null = null;
  readonly presets = PRESETS;

  onFile(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(CompressorActions.loadFile({ file }));
  }

  setCRF(e: Event): void { this.store.dispatch(CompressorActions.setCRF({ crf: parseInt((e.target as HTMLInputElement).value) })); }
  setPreset(preset: string): void { this.store.dispatch(CompressorActions.setPreset({ preset })); }

  onCompress(state: CompressorState): void {
    this.store.dispatch(CompressorActions.startProcessing());
    if (state.inputFile) {
      this.compressorService.process(state).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') this.store.dispatch(CompressorActions.updateProgress({ progress: msg.value }));
          else if (msg.type === 'complete') {
            const blob = new Blob([msg.data as BlobPart], { type: `video/${state.outputFormat}` });
            this.store.dispatch(CompressorActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / 1024 / 1024 }));
          }
        },
        error: (err) => this.store.dispatch(CompressorActions.processingFailure({ message: err.message }))
      });
    }
  }

  onDownload(state: CompressorState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const a = Object.assign(document.createElement('a'), { href: url, download: `omni_compressed.${state.outputFormat}` });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  onReset(): void {
    if (this.videoUrl) { URL.revokeObjectURL(this.videoUrl); this.videoUrl = null; }
    this.store.dispatch(CompressorActions.resetState());
  }
}