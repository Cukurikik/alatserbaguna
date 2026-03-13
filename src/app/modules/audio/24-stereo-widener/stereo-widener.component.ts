import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { animate, style, transition, trigger } from '@angular/animations';
import { StereoWidenerActions, StereoWidenerState, selectStereoWidenerState } from './stereo-widener.store';
import { StereoWidenerService } from './stereo-widener.service';
import { AudioDropZoneComponent } from '../shared/components/audio-drop-zone/audio-drop-zone.component';
import { AudioProgressRingComponent } from '../shared/components/audio-progress-ring/audio-progress-ring.component';

@Component({
  selector: 'app-stereo-widener',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, DecimalPipe, AudioDropZoneComponent, AudioProgressRingComponent],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [style({ opacity: 0 }), animate('400ms ease-out', style({ opacity: 1 }))])
    ]),
    trigger('slideUp', [
      transition(':enter', [style({ opacity: 0, transform: 'translateY(20px)' }), animate('500ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0)' }))])
    ]),
  ],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-sky-400 via-sky-500 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            ↔️ Stereo Widener
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Enhance stereo width using Mid-Side processing.</p>
        </div>
        @if (state$ | async; as state) {
          @if (state.inputFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-sky-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-sky-950/30 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </span>
              Reset
            </button>
          }
        }
      </div>

      @if (state$ | async; as state) {
        @if (!state.inputFile) {
          <div class="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full py-12" [@slideUp]>
            <app-audio-drop-zone (filesSelected)="onFileSelected($event)"></app-audio-drop-zone>
            <div class="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="p-6 rounded-2xl bg-gray-900/40 border border-gray-800 backdrop-blur-md group hover:border-sky-500/30 transition-all duration-500">
                <div class="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 mb-4 group-hover:scale-110 transition-transform">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <h4 class="text-white font-black text-sm uppercase tracking-tight">Client-Side</h4>
                <p class="text-xs text-gray-500 mt-1 leading-relaxed">100% offline processing, no data leaves your device.</p>
              </div>
              <div class="p-6 rounded-2xl bg-gray-900/40 border border-gray-800 backdrop-blur-md group hover:border-sky-500/30 transition-all duration-500">
                <div class="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 mb-4 group-hover:scale-110 transition-transform">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                </div>
                <h4 class="text-white font-black text-sm uppercase tracking-tight">High Quality</h4>
                <p class="text-xs text-gray-500 mt-1 leading-relaxed">Powered by FFmpeg WASM and Web Audio API.</p>
              </div>
              <div class="p-6 rounded-2xl bg-gray-900/40 border border-gray-800 backdrop-blur-md group hover:border-sky-500/30 transition-all duration-500">
                <div class="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 mb-4 group-hover:scale-110 transition-transform">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                </div>
                <h4 class="text-white font-black text-sm uppercase tracking-tight">Instant Export</h4>
                <p class="text-xs text-gray-500 mt-1 leading-relaxed">Download result instantly in multiple formats.</p>
              </div>
            </div>
          </div>
        }

        @if (state.inputFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8 min-h-0" [@fadeIn]>
            <div class="flex-1 flex flex-col gap-6 min-h-0">

              <!-- File Info -->
              <div class="bg-gray-900/40 backdrop-blur-md rounded-2xl p-6 border border-gray-800">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 text-2xl">🎵</div>
                  <div class="flex-1 min-w-0">
                    <p class="text-white font-black text-sm truncate">{{ state.inputFile.name }}</p>
                    <p class="text-gray-500 text-xs mt-1">{{ (state.inputFile.size / 1024 / 1024) | number:'1.2-2' }} MB</p>
                  </div>
                  <div class="px-3 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20">
                    <span class="text-xs font-bold text-sky-400 uppercase">{{ state.status }}</span>
                  </div>
                </div>
              </div>

              <!-- Processing Controls -->
              <div class="bg-gray-900/40 backdrop-blur-md rounded-2xl p-6 border border-gray-800">
                <h3 class="text-sm font-black text-white uppercase tracking-wider mb-6">⚙️ Processing Options</h3>

                <!-- Format Selector -->
                <div class="mb-6">
                  <label class="block text-xs text-gray-500 uppercase font-bold tracking-widest mb-3">Output Format</label>
                  <div class="flex flex-wrap gap-2">
                    @for (fmt of formats; track fmt) {
                      <button
                        (click)="selectedFormat = fmt"
                        class="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all"
                        [class]="selectedFormat === fmt ? 'bg-sky-500/20 border-sky-500/50 text-sky-400' : 'bg-gray-800/50 border-gray-700 text-gray-500 hover:border-gray-600'">
                        {{ fmt.toUpperCase() }}
                      </button>
                    }
                  </div>
                </div>

                <!-- Process Button -->
                <button
                  (click)="onProcess(state)"
                  [disabled]="state.status === 'processing' || state.status === 'loading'"
                  class="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                  [class]="(state.status === 'processing' || state.status === 'loading') ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-sky-600 to-sky-500 hover:opacity-90 text-white shadow-lg shadow-sky-500/20 active:scale-95'">
                  @if (state.status === 'processing') {
                    <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    Processing...
                  } @else {
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    Process Audio
                  }
                </button>
              </div>

              <!-- Progress -->
              @if (state.status === 'processing') {
                <div class="bg-gray-900/40 backdrop-blur-md rounded-2xl p-6 border border-gray-800 flex flex-col items-center gap-4" [@fadeIn]>
                  <app-audio-progress-ring [progress]="state.progress" [color]="'sky'"></app-audio-progress-ring>
                  <span class="text-sky-400 font-mono text-xs uppercase tracking-widest animate-pulse">Processing... {{ state.progress }}%</span>
                </div>
              }

              <!-- Error -->
              @if (state.status === 'error' && state.errorMessage) {
                <div class="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4" [@fadeIn]>
                  <svg class="w-5 h-5 text-rose-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <div class="flex-1">
                    <p class="text-white font-black text-xs uppercase">Processing Error</p>
                    <p class="text-rose-400 text-xs mt-1 leading-relaxed">{{ state.errorMessage }}</p>
                    @if (state.retryable) {
                      <button (click)="onProcess(state)" class="mt-2 text-xs font-black text-sky-400 hover:text-white underline underline-offset-4">Retry</button>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Right Panel: Output -->
            <div class="w-full lg:w-80 flex flex-col gap-6">
              @if (state.status === 'done' && state.outputBlob) {
                <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex flex-col gap-4" [@slideUp]>
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <div>
                      <p class="text-white font-black text-sm">Processing Complete!</p>
                      <p class="text-emerald-400 text-xs">{{ state.outputSizeMB | number:'1.2-2' }} MB output</p>
                    </div>
                  </div>
                  <button (click)="onDownload(state)" class="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    Download Result
                  </button>
                </div>
              }

              <!-- Info Card -->
              <div class="bg-gray-900/20 rounded-2xl p-6 border border-white/5 border-dashed">
                <h4 class="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">ℹ️ About This Tool</h4>
                <p class="text-xs text-gray-600 leading-relaxed">Enhance stereo width using Mid-Side processing.</p>
                <div class="mt-4 space-y-2">
                  <div class="flex justify-between">
                    <span class="text-xs text-gray-600">Engine</span>
                    <span class="text-xs text-sky-400 font-bold">FFmpeg WASM</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-xs text-gray-600">Client-Side</span>
                    <span class="text-xs text-emerald-400 font-bold">100%</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-xs text-gray-600">Max File Size</span>
                    <span class="text-xs text-white font-bold">500 MB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
  `],
})
export class StereoWidenerComponent implements OnDestroy {
  private store = inject(Store);
  private service = inject(StereoWidenerService);

  readonly state$ = this.store.select(selectStereoWidenerState);
  formats = ['wav', 'mp3', 'aac', 'ogg', 'flac', 'opus', 'm4a'];
  selectedFormat = 'mp3';
  private blobUrl: string | null = null;

  onFileSelected(files: File[]): void {
    if (files.length > 0) {
      this.store.dispatch(StereoWidenerActions.loadFile({ file: files[0] }));
    }
  }

  onProcess(state: any): void {
    if (!state.inputFile || state.status === 'processing' || state.status === 'loading') return;
    this.store.dispatch({ type: '[StereoWidener] Start Processing', format: this.selectedFormat });
  }

  onDownload(state: StereoWidenerState): void {
    if (!state.outputBlob) return;
    const url = URL.createObjectURL(state.outputBlob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: this.service.getOutputFilename(state.inputFile?.name || 'audio', this.selectedFormat)
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 150);
  }

  onReset(): void {
    if (this.blobUrl) { URL.revokeObjectURL(this.blobUrl); this.blobUrl = null; }
    this.store.dispatch(StereoWidenerActions.resetState());
  }

  ngOnDestroy(): void {
    if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
  }
}
