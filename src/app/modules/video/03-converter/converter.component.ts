import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { ConverterActions, selectConverterState } from './converter.store';
import { ConverterService } from './converter.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { ConverterState } from './converter.store';

const RESOLUTIONS = ['original', '4K (2160p)', '1080p', '720p', '480p', '360p'];
const FORMATS = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'gif'];

@Component({
  selector: 'app-converter',
  standalone: true,
  imports: [CommonModule, AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent pb-1">Video Converter</h2>
        <p class="text-gray-400 text-sm mt-1">Convert to any format with full resolution and CRF quality control.</p>
      </div>

      <ng-container *ngIf="vm$ | async as vm">
        <ng-container *ngIf="!vm.inputFile">
          <div class="flex-1 flex flex-col justify-center">
            <app-file-drop-zone accept="video/*" (fileDropped)="onFile($event)"></app-file-drop-zone>
          </div>
        </ng-container>

        <ng-container *ngIf="vm.inputFile">
          <div class="flex flex-col lg:flex-row gap-6">
            <div class="flex-1 flex flex-col gap-6">
              <app-video-preview [videoUrl]="videoUrl"></app-video-preview>
              <div class="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <p class="text-xs text-gray-400 uppercase tracking-widest mb-1">Source File</p>
                <p class="text-white font-medium truncate">{{ vm.inputFile.name }}</p>
                <p class="text-gray-500 text-xs mt-0.5">{{ (vm.inputFile.size / 1024 / 1024).toFixed(2) }} MB</p>
              </div>
            </div>

            <div class="w-full lg:w-96 flex flex-col gap-4">
              <!-- Output Format -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-5">
                <label class="block text-sm font-semibold text-gray-300 mb-3">Output Format</label>
                <div class="grid grid-cols-3 gap-2">
                  <ng-container *ngFor="let fmt of formats">
                    <button (click)="setFormat(fmt)"
                      [class]="vm.outputFormat === fmt
                        ? 'bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)]'
                        : 'bg-gray-900 text-gray-400 hover:bg-gray-700'"
                      class="py-2 px-3 rounded-lg text-sm font-mono font-medium transition-all uppercase">
                      {{ fmt }}
                    </button>
                  </ng-container>
                </div>
              </div>

              <!-- Resolution -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-5">
                <label class="block text-sm font-semibold text-gray-300 mb-3">Resolution</label>
                <select class="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  (change)="setResolution($event)">
                  <ng-container *ngFor="let res of resolutions">
                    <option [value]="res">{{ res }}</option>
                  </ng-container>
                </select>
              </div>

              <!-- CRF Slider -->
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-5">
                <div class="flex justify-between items-center mb-3">
                  <label class="text-sm font-semibold text-gray-300">Quality (CRF)</label>
                  <span class="text-orange-400 font-mono font-bold">{{ vm.crf }}</span>
                </div>
                <input type="range" min="1" max="51" [value]="vm.crf" (input)="setCRF($event)"
                  class="w-full accent-orange-400">
                <div class="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Best Quality</span><span>Smallest Size</span>
                </div>
              </div>

              <!-- Action / Status -->
              <ng-container *ngIf="vm.status === 'processing'">
                <div class="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col items-center">
                  <app-progress-ring [progress]="vm.progress" [status]="'Converting...'"></app-progress-ring>
                </div>
              </ng-container>
              <ng-container *ngIf="vm.status === 'success'">
                <div class="bg-green-900/20 border border-green-800 rounded-xl p-5 flex flex-col items-center gap-3">
                  <p class="text-green-300 font-semibold">Conversion Complete!</p>
                  <button (click)="onDownload(vm)" class="w-full bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    Download {{ vm.outputFormat.toUpperCase() }}
                  </button>
                  <button (click)="onReset()" class="text-sm text-gray-400 hover:text-white">Convert Another</button>
                </div>
              </ng-container>
              <ng-container *ngIf="vm.status === 'idle' || vm.status === 'error'">
                <button (click)="onConvert(vm)" [disabled]="!vm.inputFile"
                  class="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold py-3 px-6 rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all active:scale-95 disabled:opacity-50">
                  Convert to {{ vm.outputFormat.toUpperCase() }}
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
export class ConverterComponent {
  private store = inject(Store);
  private converterService = inject(ConverterService);
  readonly vm$ = this.store.select(selectConverterState);
  videoUrl: string | null = null;
  readonly formats = FORMATS;
  readonly resolutions = RESOLUTIONS;

  onFile(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(ConverterActions.loadFile({ file }));
  }

  setFormat(format: string): void { this.store.dispatch(ConverterActions.setOutputFormat({ format })); }
  setResolution(e: Event): void { this.store.dispatch(ConverterActions.setResolution({ resolution: (e.target as HTMLSelectElement).value })); }
  setCRF(e: Event): void { this.store.dispatch(ConverterActions.setCRF({ crf: parseInt((e.target as HTMLInputElement).value) })); }

  onConvert(state: ConverterState): void {
    this.store.dispatch(ConverterActions.startProcessing());
    if (state.inputFile) {
      this.converterService.process(state).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') this.store.dispatch(ConverterActions.updateProgress({ progress: msg.value }));
          else if (msg.type === 'complete') {
            const blob = new Blob([msg.data as BlobPart], { type: `video/${state.outputFormat}` });
            this.store.dispatch(ConverterActions.processingSuccess({ outputBlob: blob }));
          }
        },
        error: (err) => this.store.dispatch(ConverterActions.processingFailure({ message: err.message }))
      });
    }
  }

  onDownload(state: ConverterState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const a = Object.assign(document.createElement('a'), { href: url, download: `omni_converted.${state.outputFormat}` });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  onReset(): void {
    if (this.videoUrl) { URL.revokeObjectURL(this.videoUrl); this.videoUrl = null; }
    this.store.dispatch(ConverterActions.resetState());
  }
}