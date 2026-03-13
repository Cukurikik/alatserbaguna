import { Component, ChangeDetectionStrategy, inject, OnDestroy, ViewChild, ElementRef, AfterViewInit, signal, computed } from '@angular/core';
import { AsyncPipe, DecimalPipe, NgClass } from '@angular/common';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger } from '@angular/animations';
import { TrimmerActions, selectTrimmerState } from './trimmer.store';
import { AudioDropZoneComponent } from '../shared/components/audio-drop-zone/audio-drop-zone.component';
import { ExportFormat } from '../shared/types/audio.types';

@Component({
  selector: 'app-trimmer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, DecimalPipe, NgClass, AudioDropZoneComponent],
  animations: [
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0 }), animate('400ms ease-out', style({ opacity: 1 }))])]),
    trigger('slideUp', [transition(':enter', [style({ opacity: 0, transform: 'translateY(20px)' }), animate('500ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0)' }))])]),
  ],
  template: `
    <div class="h-full w-full bg-[#0a0a0f] text-white p-6 flex flex-col overflow-y-auto" [@fadeIn]>
      
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent drop-shadow-md tracking-tight">
            ✂️ Audio Trimmer
          </h2>
          <p class="text-gray-400 text-sm mt-1 uppercase tracking-widest">Precision cut with waveform accuracy</p>
        </div>
        @if ((state$ | async)?.inputFile) {
          <button (click)="onReset()" class="px-4 py-2 bg-gray-900 hover:bg-red-900/40 text-gray-400 hover:text-red-400 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors border border-gray-800">
            Reset File
          </button>
        }
      </div>

      @if (state$ | async; as state) {
        @if (!state.inputFile) {
          <div class="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full py-12" [@slideUp]>
            <app-audio-drop-zone (fileSelected)="onFileSelected($event)"></app-audio-drop-zone>
          </div>
        } @else {
          <div class="flex-1 flex flex-col gap-6" [@fadeIn]>
            
            <!-- Waveform Editor Section -->
            <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col gap-6">
              
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-xl">✂️</div>
                  <div>
                    <h3 class="font-bold text-white">{{ state.inputFile.name }}</h3>
                    <p class="text-gray-500 text-xs">{{ (state.inputFile.size / 1024 / 1024) | number:'1.2-2' }} MB • {{ formatTime(state.durationMs) }}</p>
                  </div>
                </div>
                
                <div class="px-3 py-1 bg-gray-900 border border-gray-700 rounded-lg text-xs font-mono text-cyan-400">
                  Cut Length: {{ formatTime((state.endTimeMs - state.startTimeMs)) }}
                </div>
              </div>

              <!-- Interactive Waveform -->
              <div class="relative w-full h-48 bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden flex items-center justify-center">
                
                @if (state.waveformPeaks.length === 0) {
                  <div class="flex flex-col items-center gap-3 text-cyan-500/50 animate-pulse">
                     <svg class="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                     <span class="text-xs font-bold uppercase tracking-widest">Extracting Waveform...</span>
                  </div>
                } @else {
                  <!-- Waveform SVG Render -->
                  <div class="absolute inset-0 w-full h-full flex items-end px-[2px]">
                    @for (peak of state.waveformPeaks; track $index) {
                      <div class="flex-1 bg-cyan-700/60 transition-all rounded-t-sm mx-[1px]" 
                           [style.height.%]="peak * 100"></div>
                    }
                  </div>

                  <!-- Overlay Trimmer Window -->
                  <div class="absolute inset-y-0 left-0 bg-black/70 border-r border-cyan-500/50" 
                       [style.width.%]="(state.startTimeMs / state.durationMs) * 100"></div>
                  
                  <div class="absolute inset-y-0 right-0 bg-black/70 border-l border-cyan-500/50" 
                       [style.width.%]="100 - (state.endTimeMs / state.durationMs) * 100"></div>

                  <!-- Range Inputs (Invisible overlay) -->
                  <input type="range" min="0" [max]="state.durationMs" [value]="state.startTimeMs"
                         (input)="onStartChange($event, state.durationMs)"
                         class="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-auto z-10">
                         
                  <input type="range" min="0" [max]="state.durationMs" [value]="state.endTimeMs"
                         (input)="onEndChange($event, state.durationMs)"
                         class="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-auto z-20">
                }
              </div>

              <!-- Precise Timing Controls -->
              <div class="flex gap-6 items-center">
                <div class="flex-1">
                  <label class="block text-xs text-gray-400 uppercase tracking-widest mb-2 font-bold">Start Time</label>
                  <input type="text" [value]="formatTimeMsec(state.startTimeMs)" readonly
                         class="w-full bg-gray-900 border border-gray-700 text-white font-mono text-sm rounded-lg px-4 py-3 outline-none focus:border-cyan-500">
                </div>
                <div class="flex-1">
                  <label class="block text-xs text-gray-400 uppercase tracking-widest mb-2 font-bold">End Time</label>
                  <input type="text" [value]="formatTimeMsec(state.endTimeMs)" readonly
                         class="w-full bg-gray-900 border border-gray-700 text-white font-mono text-sm rounded-lg px-4 py-3 outline-none focus:border-cyan-500">
                </div>
              </div>

            </div>

            <!-- Processing / Format Section -->
            <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col lg:flex-row gap-8 items-center justify-between">
              
              <div class="flex-1 w-full">
                 <label class="block text-xs text-gray-400 uppercase tracking-widest mb-3 font-bold">Export Format</label>
                 <div class="flex flex-wrap gap-2">
                   @for (fmt of formats; track fmt) {
                     <button (click)="outputFormat.set(fmt)"
                       class="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all"
                       [class]="outputFormat() === fmt ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-600'">
                       {{ fmt.toUpperCase() }}
                     </button>
                   }
                 </div>
              </div>

              <div class="w-full lg:w-64">
                <button (click)="onProcess(state)" 
                    [disabled]="state.status === 'processing' || state.waveformPeaks.length === 0 || (state.endTimeMs - state.startTimeMs) <= 100"
                    class="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    [class]="state.status === 'processing' ? 'bg-gray-800 text-cyan-500' : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 text-white shadow-lg active:scale-95'">
                    
                    @if (state.status === 'processing') {
                      <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                      {{ state.progress }}%
                    } @else if (state.status === 'done') {
                      ✨ Trim Again
                    } @else {
                      ✂️ Trim Audio
                    }
                </button>
              </div>

            </div>

            <!-- Results Section -->
            @if (state.status === 'done' && state.outputBlob) {
              <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex flex-col lg:flex-row items-center gap-6" [@slideUp]>
                
                <div class="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl shrink-0">✅</div>
                
                <div class="flex-1 min-w-0">
                  <p class="text-white font-black text-lg mb-1">Trimming Complete!</p>
                  <p class="text-emerald-400/80 text-sm">Successfully sliced audio down to {{ state.outputSizeMB | number:'1.2-2' }} MB.</p>
                </div>

                <div class="flex items-center gap-4 w-full lg:w-auto">
                   <audio [src]="getBlobUrl(state.outputBlob)" controls class="h-10"></audio>
                   <button (click)="onDownload(state)" class="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all whitespace-nowrap">
                     Download
                   </button>
                </div>
              </div>
            }

            @if (state.status === 'error') {
               <div class="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                 <span class="font-bold">Error:</span> {{ state.errorMessage }}
               </div>
            }

          </div>
        }
      }

    </div>
  `,
  styles: [`:host { display: block; height: 100%; }`]
})
export class TrimmerComponent implements OnDestroy {
  private store = inject(Store);
  readonly state$ = this.store.select(selectTrimmerState);
  
  formats: ExportFormat[] = ['wav', 'mp3', 'aac', 'ogg', 'flac', 'opus', 'm4a'];
  outputFormat = signal<ExportFormat>('mp3');
  private cachedBlobUrls = new Map<Blob, string>();

  onFileSelected(files: File[]): void {
    if (files.length > 0) this.store.dispatch(TrimmerActions.loadFile({ file: files[0] }));
  }

  onStartChange(event: Event, durationMs: number) {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    this.store.dispatch(TrimmerActions.setInPoint({ ms: val }));
  }

  onEndChange(event: Event, durationMs: number) {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    this.store.dispatch(TrimmerActions.setOutPoint({ ms: val }));
  }

  onProcess(state: any): void {
    if (state.status === 'processing') return;
    this.store.dispatch(TrimmerActions.startProcessing({ format: this.outputFormat() }));
  }

  onDownload(state: any): void {
    if (!state.outputBlob) return;
    const url = this.getBlobUrl(state.outputBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omni_trim_${state.inputFile?.name?.replace(/\.[^.]+$/, '')}_${Date.now()}.${this.outputFormat()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  getBlobUrl(blob: Blob): string {
    if (this.cachedBlobUrls.has(blob)) return this.cachedBlobUrls.get(blob)!;
    const url = URL.createObjectURL(blob);
    this.cachedBlobUrls.set(blob, url);
    return url;
  }

  onReset(): void {
    this.cachedBlobUrls.forEach(url => URL.revokeObjectURL(url));
    this.cachedBlobUrls.clear();
    this.store.dispatch(TrimmerActions.resetState());
  }

  formatTime(ms: number | undefined): string {
    if (!ms) return '00:00';
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `\${m}:\${s}`;
  }

  formatTimeMsec(ms: number | undefined): string {
    if (!ms) return '00:00.000';
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    const msStr = (ms % 1000).toString().padStart(3, '0');
    return `\${m}:\${s}.\${msStr}`;
  }

  ngOnDestroy(): void {
    this.onReset();
  }
}
