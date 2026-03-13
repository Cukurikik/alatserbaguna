import { Component, ChangeDetectionStrategy, inject, OnDestroy, signal, computed } from '@angular/core';
import { AsyncPipe, DecimalPipe, NgClass } from '@angular/common';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger } from '@angular/animations';
import { PitchActions, selectPitchState } from './pitch.store';
import { AudioDropZoneComponent } from '../shared/components/audio-drop-zone/audio-drop-zone.component';
import { ExportFormat } from '../shared/types/audio.types';

@Component({
  selector: 'app-pitch',
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
          <h2 class="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent drop-shadow-md tracking-tight">
            🎵 Pitch Shifter
          </h2>
          <p class="text-gray-400 text-sm mt-1 uppercase tracking-widest">Change key without affecting speed</p>
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
                  <div class="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 text-2xl">🎹</div>
                  <div>
                    <h3 class="font-bold text-white text-lg">{{ state.inputFile.name }}</h3>
                    <div class="flex gap-3 text-xs text-gray-500 font-mono mt-1">
                      <span>{{ (state.inputFile.size / 1024 / 1024) | number:'1.2-2' }} MB</span>
                      <span class="text-gray-700">•</span>
                      <span class="uppercase">{{ state.inputFile.name.split('.').pop() }}</span>
                    </div>
                  </div>
                </div>
                <div class="px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-xs font-bold text-purple-500/50 uppercase">Source</div>
              </div>

              <!-- Pitch Parameters -->
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col gap-8 flex-1">
                <div>
                  <h3 class="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-4">Tuning Configuration</h3>
                </div>

                <!-- Semitones Control -->
                <div class="flex flex-col gap-4">
                  <div class="flex justify-between items-center">
                    <label class="block text-sm text-gray-300 font-bold">Pitch Shift (Semitones)</label>
                    <div class="flex items-center gap-2">
                       <button (click)="adjustSemi(-1)" class="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-lg active:scale-95 transition-all">-</button>
                       <span class="w-16 text-center text-lg text-purple-400 font-mono font-bold">{{ semitoneDisplay() }}</span>
                       <button (click)="adjustSemi(1)" class="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-lg active:scale-95 transition-all">+</button>
                    </div>
                  </div>
                  <input type="range" min="-12" max="12" step="1" [value]="semitones()" (input)="onSemiChange($event)" class="w-full accent-purple-500 cursor-pointer h-2 bg-gray-800 rounded-lg appearance-none">
                  
                  <div class="flex justify-between text-[10px] text-gray-600 font-mono uppercase font-bold mt-1 px-1">
                    <span>-1 Octave</span>
                    <span>Original Pitch</span>
                    <span>+1 Octave</span>
                  </div>
                </div>

                <!-- Preserve Tempo Toggle -->
                <div class="mt-4 p-5 rounded-xl border transition-colors flex items-start gap-4 cursor-pointer" 
                     [class]="preserveTempo() ? 'bg-purple-500/5 border-purple-500/30' : 'bg-gray-900/50 border-gray-800'"
                     (click)="toggleTempo()">
                     
                     <div class="w-6 h-6 rounded flex items-center justify-center border transition-colors mt-0.5"
                          [class]="preserveTempo() ? 'bg-purple-500 border-purple-400' : 'bg-gray-800 border-gray-600'">
                          @if(preserveTempo()) {
                            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                          }
                     </div>
                     <div>
                       <h4 class="text-sm font-bold text-gray-200">Preserve Tempo</h4>
                       <p class="text-[11px] text-gray-500 mt-1 leading-relaxed">
                         If enabled, the audio speed is corrected back to original after pitch shifting. If disabled, shifting pitch up will make the audio play faster (like a chipmunk / vinyl).
                       </p>
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
                  <select [value]="outputFormat()" (change)="onFormatChange($event)" class="w-full bg-gray-900 border border-gray-700 text-white font-bold text-sm rounded-lg px-4 py-3 outline-none focus:border-purple-500 transition-colors mb-6">
                    <option value="wav">WAV (Lossless)</option>
                    <option value="mp3">MP3</option>
                    <option value="aac">AAC</option>
                  </select>
                </div>

                @if (state.status === 'idle' || state.status === 'error') {
                  <div class="flex-1 flex flex-col justify-center opacity-50 text-center mb-6">
                    <div class="w-16 h-16 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center text-gray-600 mx-auto mb-4">
                      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                    </div>
                    <p class="text-sm font-medium">Ready to Transpose</p>
                  </div>
                }

                @if (state.status === 'processing') {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6" [@fadeIn]>
                    <!-- Custom Ring -->
                    <div class="relative w-32 h-32 flex items-center justify-center mb-6">
                      <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle class="text-gray-800" stroke-width="4" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50" />
                        <circle class="text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-all duration-300 ease-out" stroke-width="4" stroke-dasharray="290" [style.stroke-dashoffset]="290 - (290 * state.progress) / 100" stroke-linecap="round" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50" />
                      </svg>
                      <div class="absolute inset-0 flex flex-col items-center justify-center">
                        <span class="text-2xl font-black text-white">{{ state.progress }}%</span>
                      </div>
                    </div>
                    <div class="w-full h-24 bg-black/80 rounded-xl border border-gray-800 p-3 overflow-y-auto font-mono text-[10px] text-gray-500">
                      @for (log of state.logs; track $index) {
                        <div><span class="text-purple-500/50">></span > {{ log }}</div>
                      }
                    </div>
                  </div>
                }

                @if (state.status === 'done' && state.outputBlob) {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6 gap-4 text-center" [@slideUp]>
                    <div class="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-3xl shadow-[0_0_20px_rgba(16,185,129,0.2)]">✅</div>
                    <div>
                      <p class="text-white font-black text-lg mb-1">Pitch Shifted!</p>
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
                        [disabled]="state.status === 'processing' || semitones() === 0"
                        class="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        [class]="state.status === 'processing' ? 'bg-gray-800 text-purple-500' : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white shadow-[0_0_20px_rgba(168,85,247,0.2)] active:scale-95'">
                        
                        @if (state.status === 'processing') {
                          <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                          Processing...
                        } @else {
                          ⚡ Render Pitch
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
export class PitchComponent implements OnDestroy {
  private store = inject(Store);
  readonly state$ = this.store.select(selectPitchState);
  
  outputFormat = signal<ExportFormat>('wav');
  semitones = signal<number>(0);
  preserveTempo = signal<boolean>(true);

  semitoneDisplay = computed(() => {
    const val = this.semitones();
    if (val === 0) return '0';
    return val > 0 ? `+\${val}` : `\${val}`;
  });

  private cachedBlobUrls = new Map<Blob, string>();

  onFileSelected(files: File[]): void {
    if (files.length > 0) this.store.dispatch(PitchActions.loadFile({ file: files[0] }));
  }

  onSemiChange(event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    this.semitones.set(val);
  }

  adjustSemi(delta: number): void {
    const next = this.semitones() + delta;
    if (next >= -12 && next <= 12) {
      this.semitones.set(next);
    }
  }

  toggleTempo(): void {
    this.preserveTempo.update(v => !v);
  }

  onFormatChange(e: Event) {
    this.outputFormat.set((e.target as HTMLSelectElement).value as ExportFormat);
  }

  onProcess(state: any): void {
    if (state.status === 'processing' || this.semitones() === 0) return;
    this.store.dispatch(PitchActions.startProcessing({ 
      format: this.outputFormat(),
      semitones: this.semitones(),
      preserveTempo: this.preserveTempo()
    }));
  }

  onDownload(state: any): void {
    if (!state.outputBlob) return;
    const url = this.getBlobUrl(state.outputBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omni_pitch_${this.semitoneDisplay()}st_${state.inputFile?.name?.replace(/\.[^.]+$/, '')}.${this.outputFormat()}`;
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
    this.store.dispatch(PitchActions.resetState());
  }

  ngOnDestroy(): void {
    this.onReset();
  }
}
