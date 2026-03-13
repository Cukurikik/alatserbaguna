import { Component, ChangeDetectionStrategy, inject, OnDestroy, signal } from '@angular/core';
import { AsyncPipe, DecimalPipe, NgClass } from '@angular/common';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger } from '@angular/animations';
import { ConverterActions, selectConverterState } from './converter.store';
import { AudioDropZoneComponent } from '../shared/components/audio-drop-zone/audio-drop-zone.component';
import { ExportFormat } from '../shared/types/audio.types';

@Component({
  selector: 'app-converter',
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
          <h2 class="text-4xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent drop-shadow-md tracking-tight">
            🔄 Format Converter
          </h2>
          <p class="text-gray-400 text-sm mt-1 uppercase tracking-widest">Studio-grade audio transcoding engine</p>
        </div>
        @if ((state$ | async)?.inputFile) {
          <button (click)="onReset()" class="px-4 py-2 bg-gray-900 hover:bg-red-900/40 text-gray-400 hover:text-red-400 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors border border-gray-800">
            Reset Engine
          </button>
        }
      </div>

      @if (state$ | async; as state) {
        @if (!state.inputFile) {
          <div class="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full py-12" [@slideUp]>
            <app-audio-drop-zone (fileSelected)="onFileSelected($event)"></app-audio-drop-zone>
          </div>
        } @else {
          <div class="flex-1 flex flex-col lg:flex-row gap-6" [@fadeIn]>
            
            <!-- Left Panel: Input & Settings -->
            <div class="flex-1 flex flex-col gap-6">
              
              <!-- Input File Card -->
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 text-2xl">🎵</div>
                  <div>
                    <h3 class="font-bold text-white text-lg">{{ state.inputFile.name }}</h3>
                    <div class="flex gap-3 text-xs text-gray-500 font-mono mt-1">
                      <span>{{ (state.inputFile.size / 1024 / 1024) | number:'1.2-2' }} MB</span>
                      <span class="text-gray-700">•</span>
                      <span class="uppercase">{{ state.inputFile.name.split('.').pop() }}</span>
                    </div>
                  </div>
                </div>
                <div class="px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-xs font-bold text-amber-500/50 uppercase">Source</div>
              </div>

              <!-- Converter Matrix Settings -->
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col gap-6 flex-1">
                <h3 class="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-4">Encoder Configuration</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  <!-- Target Format -->
                  <div>
                    <label class="block text-xs text-gray-400 uppercase tracking-widest mb-3 font-bold">Target Format</label>
                    <div class="grid grid-cols-2 lg:grid-cols-3 gap-2">
                      @for (fmt of formats; track fmt) {
                        <button (click)="outputFormat.set(fmt)"
                          class="py-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all"
                          [class]="outputFormat() === fmt ? 'bg-amber-500/20 border-amber-500/50 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-600'">
                          {{ fmt }}
                        </button>
                      }
                    </div>
                  </div>

                  <div class="flex flex-col gap-6">
                    <!-- Bitrate -->
                    <div>
                      <div class="flex justify-between items-center mb-2">
                        <label class="block text-xs text-gray-400 uppercase tracking-widest font-bold">Bitrate (Quality)</label>
                        <span class="text-xs text-amber-500 font-mono">{{ bitrate() }}</span>
                      </div>
                      <input type="range" min="0" max="4" step="1" [value]="getBitrateIndex()" (input)="onBitrateChange($event)" 
                          class="w-full accent-amber-500 cursor-pointer" [disabled]="outputFormat() === 'wav' || outputFormat() === 'flac'">
                      <div class="flex justify-between text-[10px] text-gray-600 font-mono mt-1">
                        <span>64k</span><span>128k</span><span>192k</span><span>256k</span><span>320k</span>
                      </div>
                    </div>

                    <!-- Sample Rate -->
                    <div>
                      <div class="flex justify-between items-center mb-2">
                        <label class="block text-xs text-gray-400 uppercase tracking-widest font-bold">Sample Rate</label>
                        <span class="text-xs text-amber-500 font-mono">{{ sampleRate() }} Hz</span>
                      </div>
                      <div class="flex rounded-lg border border-gray-700 overflow-hidden">
                        <button (click)="sampleRate.set(44100)" [ngClass]="{'bg-gray-700 text-white': sampleRate() === 44100, 'bg-gray-900 text-gray-500': sampleRate() !== 44100}" class="flex-1 py-2 text-xs font-bold transition-colors">44.1k</button>
                        <button (click)="sampleRate.set(48000)" [ngClass]="{'bg-gray-700 text-white': sampleRate() === 48000, 'bg-gray-900 text-gray-500': sampleRate() !== 48000}" class="flex-1 py-2 text-xs font-bold transition-colors border-x border-gray-700">48k</button>
                        <button (click)="sampleRate.set(96000)" [ngClass]="{'bg-gray-700 text-white': sampleRate() === 96000, 'bg-gray-900 text-gray-500': sampleRate() !== 96000}" class="flex-1 py-2 text-xs font-bold transition-colors">96k</button>
                      </div>
                    </div>

                    <!-- Channels -->
                    <div>
                      <label class="block text-xs text-gray-400 uppercase tracking-widest mb-2 font-bold">Channels</label>
                      <div class="flex rounded-lg border border-gray-700 overflow-hidden">
                        <button (click)="channels.set(1)" [ngClass]="{'bg-gray-700 text-white': channels() === 1, 'bg-gray-900 text-gray-500': channels() !== 1}" class="flex-1 py-2 text-xs font-bold transition-colors">Mono (1.0)</button>
                        <button (click)="channels.set(2)" [ngClass]="{'bg-gray-700 text-white': channels() === 2, 'bg-gray-900 text-gray-500': channels() !== 2}" class="flex-1 py-2 text-xs font-bold transition-colors border-l border-gray-700">Stereo (2.0)</button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            <!-- Right Panel: Processing & Output -->
            <div class="w-full lg:w-96 flex flex-col gap-6">
              
              <!-- Action Card -->
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col h-full min-h-[300px]">
                
                @if (state.status === 'idle' || state.status === 'error') {
                  <div class="flex-1 flex flex-col justify-center opacity-50 text-center mb-6">
                    <div class="w-16 h-16 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center text-gray-600 mx-auto mb-4">
                      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                    </div>
                    <p class="text-sm font-medium">Ready to Encode</p>
                    <p class="text-xs text-gray-500 mt-2">Will output as {{ outputFormat().toUpperCase() }}</p>
                  </div>
                }

                @if (state.status === 'processing') {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6" [@fadeIn]>
                    <!-- Custom Ring -->
                    <div class="relative w-32 h-32 flex items-center justify-center mb-6">
                      <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle class="text-gray-800" stroke-width="4" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50" />
                        <circle class="text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] transition-all duration-300 ease-out" stroke-width="4" stroke-dasharray="290" [style.stroke-dashoffset]="290 - (290 * state.progress) / 100" stroke-linecap="round" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50" />
                      </svg>
                      <div class="absolute inset-0 flex flex-col items-center justify-center">
                        <span class="text-2xl font-black text-white">{{ state.progress }}%</span>
                      </div>
                    </div>
                    
                    <div class="w-full h-32 bg-black/80 rounded-xl border border-gray-800 p-3 overflow-y-auto font-mono text-[10px] text-gray-500">
                      @for (log of state.logs; track $index) {
                        <div><span class="text-amber-500/50">></span > {{ log }}</div>
                      }
                    </div>
                  </div>
                }

                @if (state.status === 'done' && state.outputBlob) {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6 gap-4 text-center" [@slideUp]>
                    <div class="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-3xl shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                      <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <div>
                      <p class="text-white font-black text-xl mb-1">Conversion Complete!</p>
                      <p class="text-emerald-400 text-sm font-mono">{{ state.outputSizeMB | number:'1.2-2' }} MB • {{ outputFormat().toUpperCase() }}</p>
                    </div>
                    <audio [src]="getBlobUrl(state.outputBlob)" controls class="w-full mt-4 outline-none"></audio>
                  </div>
                }

                @if (state.status === 'error') {
                   <div class="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm" [@fadeIn]>
                     <span class="font-bold">Error:</span> {{ state.errorMessage }}
                   </div>
                }

                <div class="mt-auto">
                  @if (state.status === 'done') {
                    <button (click)="onDownload(state)" class="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-90 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      Download {{ outputFormat().toUpperCase() }}
                    </button>
                  } @else {
                    <button (click)="onProcess(state)" 
                        [disabled]="state.status === 'processing'"
                        class="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        [class]="state.status === 'processing' ? 'bg-gray-800 text-amber-500' : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:opacity-90 text-white shadow-[0_0_20px_rgba(245,158,11,0.2)] active:scale-95'">
                        
                        @if (state.status === 'processing') {
                          <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                          Encoding...
                        } @else {
                          ⚡ Start Encoding
                        }
                    </button>
                  }
                </div>

              </div>

            </div>

          </div>
        }
      }
    </div>
  `,
  styles: [`:host { display: block; height: 100%; }`]
})
export class ConverterComponent implements OnDestroy {
  private store = inject(Store);
  readonly state$ = this.store.select(selectConverterState);
  
  formats: ExportFormat[] = ['wav', 'mp3', 'aac', 'ogg', 'flac', 'opus', 'm4a'];
  outputFormat = signal<ExportFormat>('mp3');
  
  bitrateOptions = ['64k', '128k', '192k', '256k', '320k'];
  bitrate = signal<string>('192k');
  sampleRate = signal<number>(44100);
  channels = signal<number>(2);

  private cachedBlobUrls = new Map<Blob, string>();

  onFileSelected(files: File[]): void {
    if (files.length > 0) this.store.dispatch(ConverterActions.loadFile({ file: files[0] }));
  }

  getBitrateIndex(): number {
    return this.bitrateOptions.indexOf(this.bitrate());
  }

  onBitrateChange(e: Event) {
    const idx = parseInt((e.target as any).value, 10);
    this.bitrate.set(this.bitrateOptions[idx]);
  }

  onProcess(state: any): void {
    if (state.status === 'processing') return;
    this.store.dispatch(ConverterActions.startProcessing({ 
      format: this.outputFormat(),
      bitrate: this.bitrate(),
      sampleRate: this.sampleRate(),
      channels: this.channels()
    }));
  }

  onDownload(state: any): void {
    if (!state.outputBlob) return;
    const url = this.getBlobUrl(state.outputBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omni_conv_${state.inputFile?.name?.replace(/\.[^.]+$/, '')}_${this.bitrate()}.${this.outputFormat()}`;
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
    this.store.dispatch(ConverterActions.resetState());
  }

  ngOnDestroy(): void {
    this.onReset();
  }
}
