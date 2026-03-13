import { Component, ChangeDetectionStrategy, inject, OnDestroy, signal } from '@angular/core';
import { AsyncPipe, DecimalPipe, NgClass } from '@angular/common';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger } from '@angular/animations';
import { EqualizerActions, selectEqualizerState } from './equalizer.store';
import { AudioDropZoneComponent } from '../shared/components/audio-drop-zone/audio-drop-zone.component';
import { ExportFormat } from '../shared/types/audio.types';

@Component({
  selector: 'app-equalizer',
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
          <h2 class="text-4xl font-black bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent drop-shadow-md tracking-tight">
            🎛️ 10-Band Equalizer
          </h2>
          <p class="text-gray-400 text-sm mt-1 uppercase tracking-widest">Master Frequency Shaping</p>
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
            
            <!-- Left Panel: Input & EQ Settings -->
            <div class="flex-1 flex flex-col gap-6">
              
              <!-- Input File Card -->
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-2xl">🎵</div>
                  <div>
                    <h3 class="font-bold text-white text-lg">{{ state.inputFile.name }}</h3>
                    <div class="flex gap-3 text-xs text-gray-500 font-mono mt-1">
                      <span>{{ (state.inputFile.size / 1024 / 1024) | number:'1.2-2' }} MB</span>
                      <span class="text-gray-700">•</span>
                      <span class="uppercase">{{ state.inputFile.name.split('.').pop() }}</span>
                    </div>
                  </div>
                </div>
                <div class="px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-xs font-bold text-emerald-500/50 uppercase">Source</div>
              </div>

              <!-- EQ Settings -->
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col gap-6 flex-1">
                <div class="flex justify-between items-end border-b border-gray-800 pb-4">
                  <h3 class="text-xs font-black text-gray-500 uppercase tracking-widest">10-Band Graphic EQ</h3>
                  <button (click)="resetBands()" class="text-[10px] font-bold text-gray-500 hover:text-emerald-400 uppercase tracking-widest transition-colors">Flat</button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                  <!-- 31 Hz -->
                  <div class="flex items-center gap-4">
                    <span class="w-12 text-right text-xs text-gray-400 font-bold uppercase tracking-wider">31 Hz</span>
                    <input type="range" min="-20" max="20" step="1" [value]="b31()" (input)="onChange('hz31', $event)" class="flex-1 accent-emerald-500 cursor-pointer">
                    <span class="w-12 text-xs text-emerald-400 font-mono">{{ b31() > 0 ? '+' : '' }}{{ b31() }} dB</span>
                  </div>
                  <!-- 62 Hz -->
                  <div class="flex items-center gap-4">
                    <span class="w-12 text-right text-xs text-gray-400 font-bold uppercase tracking-wider">62 Hz</span>
                    <input type="range" min="-20" max="20" step="1" [value]="b62()" (input)="onChange('hz62', $event)" class="flex-1 accent-emerald-500 cursor-pointer">
                    <span class="w-12 text-xs text-emerald-400 font-mono">{{ b62() > 0 ? '+' : '' }}{{ b62() }} dB</span>
                  </div>
                  <!-- 125 Hz -->
                  <div class="flex items-center gap-4">
                    <span class="w-12 text-right text-xs text-gray-400 font-bold uppercase tracking-wider">125 Hz</span>
                    <input type="range" min="-20" max="20" step="1" [value]="b125()" (input)="onChange('hz125', $event)" class="flex-1 accent-emerald-500 cursor-pointer">
                    <span class="w-12 text-xs text-emerald-400 font-mono">{{ b125() > 0 ? '+' : '' }}{{ b125() }} dB</span>
                  </div>
                  <!-- 250 Hz -->
                  <div class="flex items-center gap-4">
                    <span class="w-12 text-right text-xs text-gray-400 font-bold uppercase tracking-wider">250 Hz</span>
                    <input type="range" min="-20" max="20" step="1" [value]="b250()" (input)="onChange('hz250', $event)" class="flex-1 accent-emerald-500 cursor-pointer">
                    <span class="w-12 text-xs text-emerald-400 font-mono">{{ b250() > 0 ? '+' : '' }}{{ b250() }} dB</span>
                  </div>
                  <!-- 500 Hz -->
                  <div class="flex items-center gap-4">
                    <span class="w-12 text-right text-xs text-gray-400 font-bold uppercase tracking-wider">500 Hz</span>
                    <input type="range" min="-20" max="20" step="1" [value]="b500()" (input)="onChange('hz500', $event)" class="flex-1 accent-emerald-500 cursor-pointer">
                    <span class="w-12 text-xs text-emerald-400 font-mono">{{ b500() > 0 ? '+' : '' }}{{ b500() }} dB</span>
                  </div>
                  <!-- 1 kHz -->
                  <div class="flex items-center gap-4">
                    <span class="w-12 text-right text-xs text-gray-400 font-bold uppercase tracking-wider">1 kHz</span>
                    <input type="range" min="-20" max="20" step="1" [value]="b1k()" (input)="onChange('hz1k', $event)" class="flex-1 accent-emerald-500 cursor-pointer">
                    <span class="w-12 text-xs text-emerald-400 font-mono">{{ b1k() > 0 ? '+' : '' }}{{ b1k() }} dB</span>
                  </div>
                  <!-- 2 kHz -->
                  <div class="flex items-center gap-4">
                    <span class="w-12 text-right text-xs text-gray-400 font-bold uppercase tracking-wider">2 kHz</span>
                    <input type="range" min="-20" max="20" step="1" [value]="b2k()" (input)="onChange('hz2k', $event)" class="flex-1 accent-emerald-500 cursor-pointer">
                    <span class="w-12 text-xs text-emerald-400 font-mono">{{ b2k() > 0 ? '+' : '' }}{{ b2k() }} dB</span>
                  </div>
                  <!-- 4 kHz -->
                  <div class="flex items-center gap-4">
                    <span class="w-12 text-right text-xs text-gray-400 font-bold uppercase tracking-wider">4 kHz</span>
                    <input type="range" min="-20" max="20" step="1" [value]="b4k()" (input)="onChange('hz4k', $event)" class="flex-1 accent-emerald-500 cursor-pointer">
                    <span class="w-12 text-xs text-emerald-400 font-mono">{{ b4k() > 0 ? '+' : '' }}{{ b4k() }} dB</span>
                  </div>
                  <!-- 8 kHz -->
                  <div class="flex items-center gap-4">
                    <span class="w-12 text-right text-xs text-gray-400 font-bold uppercase tracking-wider">8 kHz</span>
                    <input type="range" min="-20" max="20" step="1" [value]="b8k()" (input)="onChange('hz8k', $event)" class="flex-1 accent-emerald-500 cursor-pointer">
                    <span class="w-12 text-xs text-emerald-400 font-mono">{{ b8k() > 0 ? '+' : '' }}{{ b8k() }} dB</span>
                  </div>
                  <!-- 16 kHz -->
                  <div class="flex items-center gap-4">
                    <span class="w-12 text-right text-xs text-gray-400 font-bold uppercase tracking-wider">16 kHz</span>
                    <input type="range" min="-20" max="20" step="1" [value]="b16k()" (input)="onChange('hz16k', $event)" class="flex-1 accent-emerald-500 cursor-pointer">
                    <span class="w-12 text-xs text-emerald-400 font-mono">{{ b16k() > 0 ? '+' : '' }}{{ b16k() }} dB</span>
                  </div>
                </div>

                <div class="mt-4 flex justify-between px-16 text-[10px] text-gray-600 font-mono">
                  <span>-20dB</span><span>0dB</span><span>+20dB</span>
                </div>
              </div>

            </div>

            <!-- Right Panel: Processing & Output -->
            <div class="w-full lg:w-80 flex flex-col gap-6">
              
              <!-- Action Card -->
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col min-h-[400px]">
                
                <div>
                  <label class="block text-xs text-gray-400 uppercase tracking-widest mb-3 font-bold">Output Format</label>
                  <select [value]="outputFormat()" (change)="onFormatChange($event)" class="w-full bg-gray-900 border border-gray-700 text-white font-bold text-sm rounded-lg px-4 py-3 outline-none focus:border-emerald-500 transition-colors mb-6">
                    <option value="wav">WAV (Lossless)</option>
                    <option value="mp3">MP3</option>
                    <option value="aac">AAC</option>
                  </select>
                </div>

                @if (state.status === 'idle' || state.status === 'error') {
                  <div class="flex-1 flex flex-col justify-center opacity-50 text-center mb-6">
                    <div class="w-16 h-16 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center text-gray-600 mx-auto mb-4">
                      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
                    </div>
                    <p class="text-sm font-medium">Ready to Apply EQ</p>
                  </div>
                }

                @if (state.status === 'processing') {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6" [@fadeIn]>
                    <!-- Custom Ring -->
                    <div class="relative w-32 h-32 flex items-center justify-center mb-6">
                      <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle class="text-gray-800" stroke-width="4" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50" />
                        <circle class="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)] transition-all duration-300 ease-out" stroke-width="4" stroke-dasharray="290" [style.stroke-dashoffset]="290 - (290 * state.progress) / 100" stroke-linecap="round" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50" />
                      </svg>
                      <div class="absolute inset-0 flex flex-col items-center justify-center">
                        <span class="text-2xl font-black text-white">{{ state.progress }}%</span>
                      </div>
                    </div>
                    
                    <div class="w-full h-24 bg-black/80 rounded-xl border border-gray-800 p-3 overflow-y-auto font-mono text-[10px] text-gray-500">
                      @for (log of state.logs; track $index) {
                        <div><span class="text-emerald-500/50">></span > {{ log }}</div>
                      }
                    </div>
                  </div>
                }

                @if (state.status === 'done' && state.outputBlob) {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6 gap-4 text-center" [@slideUp]>
                    <div class="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-3xl shadow-[0_0_20px_rgba(16,185,129,0.2)]">✅</div>
                    <div>
                      <p class="text-white font-black text-lg mb-1">EQ Applied!</p>
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
                        [class]="state.status === 'processing' ? 'bg-gray-800 text-emerald-500' : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-90 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95'">
                        
                        @if (state.status === 'processing') {
                          <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                          Processing...
                        } @else {
                          🎛️ Render EQ
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
export class EqualizerComponent implements OnDestroy {
  private store = inject(Store);
  readonly state$ = this.store.select(selectEqualizerState);
  
  outputFormat = signal<ExportFormat>('wav');
  
  b31 = signal(0);
  b62 = signal(0);
  b125 = signal(0);
  b250 = signal(0);
  b500 = signal(0);
  b1k = signal(0);
  b2k = signal(0);
  b4k = signal(0);
  b8k = signal(0);
  b16k = signal(0);

  private cachedBlobUrls = new Map<Blob, string>();

  onFileSelected(files: File[]): void {
    if (files.length > 0) this.store.dispatch(EqualizerActions.loadFile({ file: files[0] }));
  }

  resetBands(): void {
    [this.b31, this.b62, this.b125, this.b250, this.b500, this.b1k, this.b2k, this.b4k, this.b8k, this.b16k].forEach(b => b.set(0));
  }

  onChange(band: string, event: Event): void {
    const val = parseInt((e.target as any).value, 10);
    switch (band) {
      case 'hz31': this.b31.set(val); break;
      case 'hz62': this.b62.set(val); break;
      case 'hz125': this.b125.set(val); break;
      case 'hz250': this.b250.set(val); break;
      case 'hz500': this.b500.set(val); break;
      case 'hz1k': this.b1k.set(val); break;
      case 'hz2k': this.b2k.set(val); break;
      case 'hz4k': this.b4k.set(val); break;
      case 'hz8k': this.b8k.set(val); break;
      case 'hz16k': this.b16k.set(val); break;
    }
  }

  onFormatChange(e: Event) {
    this.outputFormat.set((e.target as any).value as ExportFormat);
  }

  onProcess(state: any): void {
    if (state.status === 'processing') return;
    this.store.dispatch(EqualizerActions.startProcessing({ 
      format: this.outputFormat(),
      bands: {
        hz31: this.b31(), hz62: this.b62(), hz125: this.b125(), hz250: this.b250(),
        hz500: this.b500(), hz1k: this.b1k(), hz2k: this.b2k(), hz4k: this.b4k(),
        hz8k: this.b8k(), hz16k: this.b16k()
      }
    }));
  }

  onDownload(state: any): void {
    if (!state.outputBlob) return;
    const url = this.getBlobUrl(state.outputBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omni_eq_${state.inputFile?.name?.replace(/\.[^.]+$/, '')}.${this.outputFormat()}`;
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
    this.resetBands();
    this.store.dispatch(EqualizerActions.resetState());
  }

  ngOnDestroy(): void {
    this.onReset();
  }
}
