import { Component, ChangeDetectionStrategy, inject, OnDestroy, signal } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger } from '@angular/animations';
import { ReverserActions, selectReverserState } from './reverser.store';
import { AudioDropZoneComponent } from '../shared/components/audio-drop-zone/audio-drop-zone.component';
import { ExportFormat } from '../shared/types/audio.types';

@Component({
  selector: 'app-reverser',
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
          <h2 class="text-4xl font-black bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent drop-shadow-md tracking-tight">
            ⏪ Audio Reverser
          </h2>
          <p class="text-gray-400 text-sm mt-1 uppercase tracking-widest">Play audio backwards end-to-end</p>
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
                  <div class="w-14 h-14 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-500 text-2xl">🔄</div>
                  <div>
                    <h3 class="font-bold text-white text-lg">{{ state.inputFile.name }}</h3>
                    <div class="flex gap-3 text-xs text-gray-500 font-mono mt-1">
                      <span>{{ (state.inputFile.size / 1024 / 1024) | number:'1.2-2' }} MB</span>
                      <span class="text-gray-700">•</span>
                      <span class="uppercase">{{ state.inputFile.name.split('.').pop() }}</span>
                    </div>
                  </div>
                </div>
                <div class="px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-xs font-bold text-teal-500/50 uppercase">Source</div>
              </div>

              <!-- Reverser Parameters -->
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col justify-center items-center gap-8 flex-1 relative overflow-hidden">
                <!-- Decorative Graphic -->
                <svg class="absolute w-full h-full opacity-5 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M100 0 L0 100 L0 90 L90 0 Z" fill="currentColor" class="text-teal-500"></path>
                  <path d="M100 20 L20 100 L0 100 L100 0 Z" fill="currentColor" class="text-cyan-500"></path>
                </svg>

                <div class="text-center z-10 w-full max-w-sm">
                  <div class="w-24 h-24 mx-auto rounded-full bg-teal-500/10 border-2 border-teal-500/30 flex items-center justify-center text-teal-400 mb-6 drop-shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                    <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <h3 class="text-xl font-bold text-white mb-2">Reverse entire track</h3>
                  <p class="text-sm text-gray-400 leading-relaxed mb-8">
                    The entire audio file will be reversed sample by sample. This requires decoding the whole track into memory, which may take a few moments for very large files.
                  </p>

                  <!-- Crossfade Toggle -->
                  <div class="p-4 rounded-xl border transition-colors flex items-center justify-between cursor-pointer" 
                      [class]="crossfadeEdges() ? 'bg-teal-500/5 border-teal-500/30' : 'bg-gray-900/50 border-gray-800'"
                      (click)="toggleCrossfade()"
                      (keydown.enter)="toggleCrossfade()"
                      (keydown.space)="toggleCrossfade()"
                      tabindex="0"
                      role="checkbox"
                      [attr.aria-checked]="crossfadeEdges()">
                      <div class="text-left pr-4">
                        <h4 class="text-sm font-bold text-gray-200">Anti-Pop Fade</h4>
                        <p class="text-[10px] text-gray-500 mt-1">Applies a 50ms fade-in/out at the boundaries to prevent sudden speaker clicks.</p>
                      </div>
                      <div class="w-10 h-6 rounded-full transition-colors relative"
                            [class]="crossfadeEdges() ? 'bg-teal-500' : 'bg-gray-700'">
                            <div class="w-4 h-4 rounded-full bg-white absolute top-1 transition-transform"
                                [class]="crossfadeEdges() ? 'translate-x-5' : 'translate-x-1'"></div>
                      </div>
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
                  <select [value]="outputFormat()" (change)="onFormatChange($event)" class="w-full bg-gray-900 border border-gray-700 text-white font-bold text-sm rounded-lg px-4 py-3 outline-none focus:border-teal-500 transition-colors mb-6">
                    <option value="wav">WAV (Lossless)</option>
                    <option value="mp3">MP3</option>
                    <option value="aac">AAC</option>
                  </select>
                </div>

                @if (state.status === 'idle' || state.status === 'error') {
                  <div class="flex-1 flex flex-col justify-center opacity-50 text-center mb-6">
                    <div class="w-16 h-16 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center text-gray-600 mx-auto mb-4">
                      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"></path></svg>
                    </div>
                    <p class="text-sm font-medium">Ready to Reverse</p>
                  </div>
                }

                @if (state.status === 'processing') {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6" [@fadeIn]>
                    <div class="relative w-32 h-32 flex items-center justify-center mb-6">
                      <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle class="text-gray-800" stroke-width="4" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50" />
                        <circle class="text-teal-500 drop-shadow-[0_0_8px_rgba(20,184,166,0.8)] transition-all duration-300 ease-out" stroke-width="4" stroke-dasharray="290" [style.stroke-dashoffset]="290 - (290 * state.progress) / 100" stroke-linecap="round" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50" />
                      </svg>
                      <div class="absolute inset-0 flex flex-col items-center justify-center">
                        <span class="text-2xl font-black text-white">{{ state.progress }}%</span>
                      </div>
                    </div>
                    <div class="w-full h-24 bg-black/80 rounded-xl border border-gray-800 p-3 overflow-y-auto font-mono text-[10px] text-gray-500">
                      @for (log of state.logs; track $index) {
                        <div><span class="text-teal-500/50">></span > {{ log }}</div>
                      }
                    </div>
                  </div>
                }

                @if (state.status === 'done' && state.outputBlob) {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6 gap-4 text-center" [@slideUp]>
                    <div class="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-3xl shadow-[0_0_20px_rgba(16,185,129,0.2)]">✅</div>
                    <div>
                      <p class="text-white font-black text-lg mb-1">Reversed!</p>
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
                        [class]="state.status === 'processing' ? 'bg-gray-800 text-teal-500' : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:opacity-90 text-white shadow-[0_0_20px_rgba(20,184,166,0.2)] active:scale-95'">
                        
                        @if (state.status === 'processing') {
                          <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                          Reversing...
                        } @else {
                          ⏪ Reverse Audio
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
export class ReverserComponent implements OnDestroy {
  private store = inject(Store);
  readonly state$ = this.store.select(selectReverserState);
  
  outputFormat = signal<ExportFormat>('wav');
  crossfadeEdges = signal<boolean>(true);

  private cachedBlobUrls = new Map<Blob, string>();

  onFileSelected(files: File[]): void {
    if (files.length > 0) this.store.dispatch(ReverserActions.loadFile({ file: files[0] }));
  }

  toggleCrossfade(): void {
    this.crossfadeEdges.update(v => !v);
  }

  onFormatChange(e: Event) {
    this.outputFormat.set((e.target as any).value as ExportFormat);
  }

  onProcess(state: any): void {
    if (state.status === 'processing') return;
    this.store.dispatch(ReverserActions.startProcessing({ 
      format: this.outputFormat(),
      crossfadeEdges: this.crossfadeEdges()
    }));
  }

  onDownload(state: any): void {
    if (!state.outputBlob) return;
    const url = this.getBlobUrl(state.outputBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omni_reversed_${state.inputFile?.name?.replace(/\.[^.]+$/, '')}.${this.outputFormat()}`;
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
    this.store.dispatch(ReverserActions.resetState());
  }

  ngOnDestroy(): void {
    this.onReset();
  }
}
