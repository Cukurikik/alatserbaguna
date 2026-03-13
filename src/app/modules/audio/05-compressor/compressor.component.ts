import { Component, ChangeDetectionStrategy, inject, OnDestroy, signal } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger } from '@angular/animations';
import { CompressorActions, selectCompressorState } from './compressor.store';
import { AudioDropZoneComponent } from '../shared/components/audio-drop-zone/audio-drop-zone.component';
import { ExportFormat } from '../shared/types/audio.types';

@Component({
  selector: 'app-compressor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, DecimalPipe, AudioDropZoneComponent],
  animations: [
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0 }), animate('400ms ease-out', style({ opacity: 1 }))])]),
    trigger('slideUp', [transition(':enter', [style({ opacity: 0, transform: 'translateY(20px)' }), animate('500ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0)' }))])]),
  ],
  template: `
    <div class="h-full w-full bg-[#0a0a0f] text-white p-6 flex flex-col overflow-y-auto" [@fadeIn]>
      
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-orange-400 to-rose-500 bg-clip-text text-transparent drop-shadow-md tracking-tight">
            🎚️ Dynamics Compressor
          </h2>
          <p class="text-gray-400 text-sm mt-1 uppercase tracking-widest">Master level compression and dynamic range control</p>
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
                  <div class="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 text-2xl">🎵</div>
                  <div>
                    <h3 class="font-bold text-white text-lg">{{ state.inputFile.name }}</h3>
                    <div class="flex gap-3 text-xs text-gray-500 font-mono mt-1">
                      <span>{{ (state.inputFile.size / 1024 / 1024) | number:'1.2-2' }} MB</span>
                      <span class="text-gray-700">•</span>
                      <span class="uppercase">{{ state.inputFile.name.split('.').pop() }}</span>
                    </div>
                  </div>
                </div>
                <div class="px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-xs font-bold text-orange-500/50 uppercase">Source</div>
              </div>

              <!-- Compressor Matrix Settings -->
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                
                <div class="col-span-1 md:col-span-2">
                  <h3 class="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-4">Compression Parameters</h3>
                </div>

                <!-- Threshold -->
                <div class="flex flex-col gap-2">
                  <div class="flex justify-between items-center">
                    <label class="block text-xs text-gray-400 uppercase tracking-widest font-bold">Threshold (dB)</label>
                    <span class="text-xs text-orange-500 font-mono">{{ thresholdDb() }} dB</span>
                  </div>
                  <input type="range" min="-60" max="0" step="1" [value]="thresholdDb()" (input)="onChange('threshold', $event)" class="w-full accent-orange-500 cursor-pointer">
                  <p class="text-[10px] text-gray-600">Level above which compression is applied.</p>
                </div>

                <!-- Ratio -->
                <div class="flex flex-col gap-2">
                  <div class="flex justify-between items-center">
                    <label class="block text-xs text-gray-400 uppercase tracking-widest font-bold">Ratio</label>
                    <span class="text-xs text-orange-500 font-mono">{{ ratio() }}:1</span>
                  </div>
                  <input type="range" min="1" max="20" step="0.5" [value]="ratio()" (input)="onChange('ratio', $event)" class="w-full accent-orange-500 cursor-pointer">
                  <p class="text-[10px] text-gray-600">Amount of gain reduction applied.</p>
                </div>

                <!-- Attack -->
                <div class="flex flex-col gap-2">
                  <div class="flex justify-between items-center">
                    <label class="block text-xs text-gray-400 uppercase tracking-widest font-bold">Attack (ms)</label>
                    <span class="text-xs text-orange-500 font-mono">{{ attackMs() }} ms</span>
                  </div>
                  <input type="range" min="1" max="500" step="1" [value]="attackMs()" (input)="onChange('attack', $event)" class="w-full accent-orange-500 cursor-pointer">
                  <p class="text-[10px] text-gray-600">How quickly compression engages.</p>
                </div>

                <!-- Release -->
                <div class="flex flex-col gap-2">
                  <div class="flex justify-between items-center">
                    <label class="block text-xs text-gray-400 uppercase tracking-widest font-bold">Release (ms)</label>
                    <span class="text-xs text-orange-500 font-mono">{{ releaseMs() }} ms</span>
                  </div>
                  <input type="range" min="10" max="2000" step="10" [value]="releaseMs()" (input)="onChange('release', $event)" class="w-full accent-orange-500 cursor-pointer">
                  <p class="text-[10px] text-gray-600">How quickly compression releases.</p>
                </div>

                <!-- Makeup Gain -->
                <div class="flex flex-col gap-2 col-span-1 md:col-span-2">
                  <div class="flex justify-between items-center">
                    <label class="block text-xs text-gray-400 uppercase tracking-widest font-bold">Makeup Gain (dB)</label>
                    <span class="text-xs text-orange-500 font-mono">+{{ makeupGainDb() }} dB</span>
                  </div>
                  <input type="range" min="0" max="24" step="1" [value]="makeupGainDb()" (input)="onChange('makeup', $event)" class="w-full accent-orange-500 cursor-pointer">
                  <div class="flex justify-between text-[10px] text-gray-600 font-mono mt-1">
                    <span>0dB</span><span>12dB</span><span>24dB</span>
                  </div>
                </div>

              </div>

            </div>

            <!-- Right Panel: Processing & Output -->
            <div class="w-full lg:w-96 flex flex-col gap-6">
              
              <!-- Action Card -->
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col min-h-[400px]">
                
                <div>
                  <label class="block text-xs text-gray-400 uppercase tracking-widest mb-3 font-bold">Output Format</label>
                  <select [value]="outputFormat()" (change)="onFormatChange($event)" class="w-full bg-gray-900 border border-gray-700 text-white font-bold text-sm rounded-lg px-4 py-3 outline-none focus:border-orange-500 transition-colors mb-6">
                    <option value="wav">WAV (Lossless)</option>
                    <option value="mp3">MP3</option>
                    <option value="aac">AAC</option>
                  </select>
                </div>

                @if (state.status === 'idle' || state.status === 'error') {
                  <div class="flex-1 flex flex-col justify-center opacity-50 text-center mb-6">
                    <div class="w-16 h-16 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center text-gray-600 mx-auto mb-4">
                      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>
                    <p class="text-sm font-medium">Ready to Compress</p>
                  </div>
                }

                @if (state.status === 'processing') {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6" [@fadeIn]>
                    <!-- Custom Ring -->
                    <div class="relative w-32 h-32 flex items-center justify-center mb-6">
                      <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle class="text-gray-800" stroke-width="4" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50" />
                        <circle class="text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] transition-all duration-300 ease-out" stroke-width="4" stroke-dasharray="290" [style.stroke-dashoffset]="290 - (290 * state.progress) / 100" stroke-linecap="round" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50" />
                      </svg>
                      <div class="absolute inset-0 flex flex-col items-center justify-center">
                        <span class="text-2xl font-black text-white">{{ state.progress }}%</span>
                      </div>
                    </div>
                    
                    <div class="w-full h-24 bg-black/80 rounded-xl border border-gray-800 p-3 overflow-y-auto font-mono text-[10px] text-gray-500">
                      @for (log of state.logs; track $index) {
                        <div><span class="text-orange-500/50">></span > {{ log }}</div>
                      }
                    </div>
                  </div>
                }

                @if (state.status === 'done' && state.outputBlob) {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6 gap-4 text-center" [@slideUp]>
                    <div class="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-3xl shadow-[0_0_20px_rgba(16,185,129,0.2)]">✅</div>
                    <div>
                      <p class="text-white font-black text-lg mb-1">Compression Applied!</p>
                      <p class="text-emerald-400 text-xs font-mono">{{ state.outputSizeMB | number:'1.2-2' }} MB</p>
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
                       Download Audio
                    </button>
                  } @else {
                    <button (click)="onProcess(state)" 
                        [disabled]="state.status === 'processing'"
                        class="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        [class]="state.status === 'processing' ? 'bg-gray-800 text-orange-500' : 'bg-gradient-to-r from-orange-600 to-red-600 hover:opacity-90 text-white shadow-[0_0_20px_rgba(249,115,22,0.2)] active:scale-95'">
                        
                        @if (state.status === 'processing') {
                          <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                          Compressing...
                        } @else {
                          🎚️ Render Master
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
export class CompressorComponent implements OnDestroy {
  private store = inject(Store);
  readonly state$ = this.store.select(selectCompressorState);
  
  outputFormat = signal<ExportFormat>('wav');
  thresholdDb = signal<number>(-20);
  ratio = signal<number>(4);
  attackMs = signal<number>(20);
  releaseMs = signal<number>(250);
  makeupGainDb = signal<number>(0);

  private cachedBlobUrls = new Map<Blob, string>();

  onFileSelected(files: File[]): void {
    if (files.length > 0) this.store.dispatch(CompressorActions.loadFile({ file: files[0] }));
  }

  onChange(type: 'threshold' | 'ratio' | 'attack' | 'release' | 'makeup', event: Event): void {
    const val = parseFloat((e.target as HTMLInputElement).value);
    switch (type) {
      case 'threshold': this.thresholdDb.set(val); break;
      case 'ratio': this.ratio.set(val); break;
      case 'attack': this.attackMs.set(val); break;
      case 'release': this.releaseMs.set(val); break;
      case 'makeup': this.makeupGainDb.set(val); break;
    }
  }

  onFormatChange(e: Event) {
    this.outputFormat.set((e.target as HTMLSelectElement).value as ExportFormat);
  }

  onProcess(state: any): void {
    if (state.status === 'processing') return;
    this.store.dispatch(CompressorActions.startProcessing({ 
      format: this.outputFormat(),
      thresholdDb: this.thresholdDb(),
      ratio: this.ratio(),
      attackMs: this.attackMs(),
      releaseMs: this.releaseMs(),
      makeupGainDb: this.makeupGainDb()
    }));
  }

  onDownload(state: any): void {
    if (!state.outputBlob) return;
    const url = this.getBlobUrl(state.outputBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omni_comp_${state.inputFile?.name?.replace(/\.[^.]+$/, '')}.${this.outputFormat()}`;
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
    this.store.dispatch(CompressorActions.resetState());
  }

  ngOnDestroy(): void {
    this.onReset();
  }
}
