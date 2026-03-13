import { Component, ChangeDetectionStrategy, inject, OnDestroy, signal, computed } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger } from '@angular/animations';
import { NormalizerActions, selectNormalizerState } from './normalizer.store';
import { AudioDropZoneComponent } from '../shared/components/audio-drop-zone/audio-drop-zone.component';
import { ExportFormat } from '../shared/types/audio.types';

@Component({
  selector: 'app-normalizer',
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
          <h2 class="text-4xl font-black bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent drop-shadow-md tracking-tight">
            🔊 Audio Normalizer
          </h2>
          <p class="text-gray-400 text-sm mt-1 uppercase tracking-widest">Broadcast standard EBU R128 & Peak Volume matching</p>
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
                  <div class="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 text-2xl">📻</div>
                  <div>
                    <h3 class="font-bold text-white text-lg">{{ state.inputFile.name }}</h3>
                    <div class="flex gap-3 text-xs text-gray-500 font-mono mt-1">
                      <span>{{ (state.inputFile.size / 1024 / 1024) | number:'1.2-2' }} MB</span>
                      <span class="text-gray-700">•</span>
                      <span class="uppercase">{{ state.inputFile.name.split('.').pop() }}</span>
                    </div>
                  </div>
                </div>
                <div class="px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-xs font-bold text-blue-500/50 uppercase">Source</div>
              </div>

              <!-- Normalizer Parameters -->
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col gap-8 flex-1">
                <div>
                  <h3 class="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-4">Volume Configuration</h3>
                </div>

                <!-- Mode Selection -->
                <div class="flex gap-4">
                  <button (click)="setMode('lufs')" 
                          class="flex-1 p-4 rounded-xl border text-left cursor-pointer transition-colors"
                          [class]="mode() === 'lufs' ? 'bg-blue-500/10 border-blue-500/50' : 'bg-gray-900/50 border-gray-800 hover:border-gray-600'">
                    <div class="flex justify-between items-start mb-2">
                       <h4 class="font-bold text-sm" [class]="mode() === 'lufs' ? 'text-blue-400' : 'text-gray-300'">Loudness (EBU R128)</h4>
                       @if(mode() === 'lufs') { <div class="w-2 h-2 rounded-full bg-blue-500 mt-1"></div> }
                    </div>
                    <p class="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Standard</p>
                    <p class="text-xs text-gray-400 mt-1">Matches perceived human loudness. Best for Podcasts, Spotify, and YouTube.</p>
                  </button>

                  <button (click)="setMode('peak')" 
                          class="flex-1 p-4 rounded-xl border text-left cursor-pointer transition-colors"
                          [class]="mode() === 'peak' ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-gray-900/50 border-gray-800 hover:border-gray-600'">
                    <div class="flex justify-between items-start mb-2">
                       <h4 class="font-bold text-sm" [class]="mode() === 'peak' ? 'text-indigo-400' : 'text-gray-300'">Peak Level</h4>
                       @if(mode() === 'peak') { <div class="w-2 h-2 rounded-full bg-indigo-500 mt-1"></div> }
                    </div>
                    <p class="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Dynamic</p>
                    <p class="text-xs text-gray-400 mt-1">Scales audio so the loudest peak hits a specific dB target. Good for raw FX.</p>
                  </button>
                </div>

                <!-- Shared target parameter (dB or LUFS) -->
                <div class="flex flex-col gap-4">
                  <div class="flex justify-between items-center">
                    <label class="block text-sm text-gray-300 font-bold">
                      {{ mode() === 'lufs' ? 'Target Loudness (LUFS)' : 'Target Peak (dB)' }}
                    </label>
                    <span class="w-16 text-right text-lg text-white font-mono font-bold">{{ targetDisplay() }}</span>
                  </div>
                  
                  <input type="range" 
                        [min]="mode() === 'lufs' ? -30 : -20" 
                        [max]="mode() === 'lufs' ? -5 : 0" 
                        step="1" 
                        [value]="targetLevel()" 
                        (input)="onTargetChange($event)" 
                        class="w-full cursor-pointer h-2 bg-gray-800 rounded-lg appearance-none"
                        [class.accent-blue-500]="mode() === 'lufs'"
                        [class.accent-indigo-500]="mode() === 'peak'">
                  
                  <!-- Presets depending on Mode -->
                  <div class="flex gap-2 mt-2">
                    @if (mode() === 'lufs') {
                      <button (click)="targetLevel.set(-14)" class="px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-[10px] font-bold font-mono text-gray-300 border border-gray-700">-14 Spotify</button>
                      <button (click)="targetLevel.set(-16)" class="px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-[10px] font-bold font-mono text-gray-300 border border-gray-700">-16 Apple</button>
                      <button (click)="targetLevel.set(-23)" class="px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-[10px] font-bold font-mono text-gray-300 border border-gray-700">-23 Broadcast</button>
                    } @else {
                      <button (click)="targetLevel.set(0)" class="px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-[10px] font-bold font-mono text-gray-300 border border-gray-700">0.0 dB (Max)</button>
                      <button (click)="targetLevel.set(-1)" class="px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-[10px] font-bold font-mono text-gray-300 border border-gray-700">-1.0 dB</button>
                      <button (click)="targetLevel.set(-3)" class="px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-[10px] font-bold font-mono text-gray-300 border border-gray-700">-3.0 dB</button>
                    }
                  </div>
                </div>

                <!-- True Peak Limit (LUFS Only) -->
                @if (mode() === 'lufs') {
                  <div class="flex flex-col gap-4 pt-6 border-t border-gray-900" [@fadeIn]>
                    <div class="flex justify-between items-center">
                      <label class="block text-sm text-gray-300 font-bold">True Peak Limit (dBTP)</label>
                      <span class="w-16 text-right text-lg text-blue-400 font-mono font-bold">{{ truePeakDisplay() }}</span>
                    </div>
                    <input type="range" min="-3" max="0" step="0.5" [value]="truePeak()" (input)="onTruePeakChange($event)" class="w-full accent-blue-400 cursor-pointer h-2 bg-gray-800 rounded-lg appearance-none">
                    <p class="text-xs text-gray-500 uppercase">Prevents digital clipping during codec conversion (usually -1.0 or -2.0)</p>
                  </div>
                }

              </div>

            </div>

            <!-- Right Panel: Processing & Output -->
            <div class="w-full lg:w-96 flex flex-col gap-6">
              
              <!-- Action Card -->
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col min-h-[400px]">
                
                <div>
                  <label class="block text-xs text-gray-400 uppercase tracking-widest mb-3 font-bold">Output Format</label>
                  <select [value]="outputFormat()" (change)="onFormatChange($event)" class="w-full bg-gray-900 border border-gray-700 text-white font-bold text-sm rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-colors mb-6">
                    <option value="wav">WAV (Lossless)</option>
                    <option value="mp3">MP3</option>
                    <option value="aac">AAC</option>
                  </select>
                </div>

                @if (state.status === 'idle' || state.status === 'error') {
                  <div class="flex-1 flex flex-col justify-center opacity-50 text-center mb-6">
                    <div class="w-16 h-16 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center text-gray-600 mx-auto mb-4">
                      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                    </div>
                    <p class="text-sm font-medium">Ready to Normalize</p>
                  </div>
                }

                @if (state.status === 'processing') {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6" [@fadeIn]>
                    <div class="relative w-32 h-32 flex items-center justify-center mb-6">
                      <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle class="text-gray-800" stroke-width="4" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50" />
                        <circle class="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] transition-all duration-300 ease-out" stroke-width="4" stroke-dasharray="290" [style.stroke-dashoffset]="290 - (290 * state.progress) / 100" stroke-linecap="round" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50" />
                      </svg>
                      <div class="absolute inset-0 flex flex-col items-center justify-center">
                        <span class="text-2xl font-black text-white">{{ state.progress }}%</span>
                      </div>
                    </div>
                    <div class="w-full h-24 bg-black/80 rounded-xl border border-gray-800 p-3 overflow-y-auto font-mono text-[10px] text-gray-500">
                      @for (log of state.logs; track $index) {
                        <div><span class="text-blue-500/50">></span > {{ log }}</div>
                      }
                    </div>
                  </div>
                }

                @if (state.status === 'done' && state.outputBlob) {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6 gap-4 text-center" [@slideUp]>
                    <div class="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-3xl shadow-[0_0_20px_rgba(16,185,129,0.2)]">✅</div>
                    <div>
                      <p class="text-white font-black text-lg mb-1">Normalized!</p>
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
                        [class]="state.status === 'processing' ? 'bg-gray-800 text-blue-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:opacity-90 text-white shadow-[0_0_20px_rgba(59,130,246,0.2)] active:scale-95'">
                        
                        @if (state.status === 'processing') {
                          <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                          Processing...
                        } @else {
                          ✨ Normalize
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
export class NormalizerComponent implements OnDestroy {
  private store = inject(Store);
  readonly state$ = this.store.select(selectNormalizerState);
  
  outputFormat = signal<ExportFormat>('wav');
  mode = signal<'lufs' | 'peak'>('lufs');
  targetLevel = signal<number>(-14);
  truePeak = signal<number>(-1);

  targetDisplay = computed(() => {
    return this.targetLevel() > 0 ? `+${this.targetLevel()}` : `${this.targetLevel()}`;
  });

  truePeakDisplay = computed(() => {
    return `${this.truePeak()}`;
  });

  private cachedBlobUrls = new Map<Blob, string>();

  onFileSelected(files: File[]): void {
    if (files.length > 0) this.store.dispatch(NormalizerActions.loadFile({ file: files[0] }));
  }

  setMode(m: 'lufs'|'peak') {
    this.mode.set(m);
    if (m === 'lufs') this.targetLevel.set(-14);
    else this.targetLevel.set(-1);
  }

  onTargetChange(event: Event): void {
    const val = parseInt((e.target as any).value, 10);
    this.targetLevel.set(val);
  }

  onTruePeakChange(event: Event): void {
    const val = parseFloat((e.target as any).value);
    this.truePeak.set(val);
  }

  onFormatChange(e: Event) {
    this.outputFormat.set((e.target as any).value as ExportFormat);
  }

  onProcess(state: any): void {
    if (state.status === 'processing') return;
    this.store.dispatch(NormalizerActions.startProcessing({ 
      format: this.outputFormat(),
      mode: this.mode(),
      targetLevel: this.targetLevel(),
      truePeak: this.truePeak()
    }));
  }

  onDownload(state: any): void {
    if (!state.outputBlob) return;
    const url = this.getBlobUrl(state.outputBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omni_normalized_${this.mode()}_${state.inputFile?.name?.replace(/\.[^.]+$/, '')}.${this.outputFormat()}`;
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
    this.store.dispatch(NormalizerActions.resetState());
  }

  ngOnDestroy(): void {
    this.onReset();
  }
}
