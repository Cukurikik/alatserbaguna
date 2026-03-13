import { Component, ChangeDetectionStrategy, inject, OnDestroy, signal, computed } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger } from '@angular/animations';
import { TimeStretchActions, selectTimeStretchState } from './time-stretch.store';
import { AudioDropZoneComponent } from '../shared/components/audio-drop-zone/audio-drop-zone.component';
import { ExportFormat } from '../shared/types/audio.types';

@Component({
  selector: 'app-time-stretch',
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
          <h2 class="text-4xl font-black bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent drop-shadow-md tracking-tight">
            ⏱️ Time Stretcher
          </h2>
          <p class="text-gray-400 text-sm mt-1 uppercase tracking-widest">Adjust speed without altering pitch</p>
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
                  <div class="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 text-2xl">⏳</div>
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

              <!-- Time Parameters -->
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col gap-8 flex-1">
                <div>
                  <h3 class="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-4">Speed & Time Controls</h3>
                </div>

                <!-- Speed Dial / Value -->
                <div class="flex flex-col items-center justify-center py-6">
                  <div class="relative w-48 h-48 flex items-center justify-center">
                     <!-- Radial SVG Background -->
                     <svg class="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle class="text-gray-800" stroke-width="6" stroke="currentColor" fill="transparent" r="42" cx="50" cy="50" stroke-dasharray="264" stroke-linecap="round" />
                        <circle class="text-orange-500 transition-all duration-300" stroke-width="6" stroke="currentColor" fill="transparent" r="42" cx="50" cy="50" 
                                [style.stroke-dashoffset]="264 - (264 * (speed() / 4.0))" 
                                stroke-dasharray="264" stroke-linecap="round" />
                     </svg>
                     <!-- Value -->
                     <div class="text-center z-10">
                        <span class="text-5xl font-black text-white font-mono tracking-tighter">{{ speedDisplay() }}</span>
                        <span class="text-xl text-orange-500 font-bold ml-1">x</span>
                        <p class="text-xs text-gray-500 mt-2 uppercase tracking-widest font-bold font-mono">Multiplier</p>
                     </div>
                  </div>
                  
                  <input type="range" min="0.1" max="4.0" step="0.05" [value]="speed()" (input)="onSpeedChange($event)" class="w-full max-w-sm mt-8 accent-orange-500 cursor-pointer h-2 bg-gray-800 rounded-lg appearance-none">
                  <div class="w-full max-w-sm flex justify-between text-[10px] text-gray-600 font-mono font-bold mt-2 px-1">
                    <span>0.1x</span>
                    <span class="text-orange-500/50">1.0x</span>
                    <span>4.0x</span>
                  </div>
                </div>

                <!-- Presets -->
                <div class="flex flex-wrap justify-center gap-2">
                  <button (click)="setSpeed(0.5)" class="px-4 py-2 rounded-lg bg-gray-900 border hover:bg-gray-800 transition-colors text-xs font-bold font-mono" [class]="speed() === 0.5 ? 'border-orange-500 text-orange-400' : 'border-gray-700 text-gray-400'">0.5x</button>
                  <button (click)="setSpeed(0.75)" class="px-4 py-2 rounded-lg bg-gray-900 border hover:bg-gray-800 transition-colors text-xs font-bold font-mono" [class]="speed() === 0.75 ? 'border-orange-500 text-orange-400' : 'border-gray-700 text-gray-400'">0.75x</button>
                  <button (click)="setSpeed(1.0)" class="px-4 py-2 rounded-lg bg-gray-900 border hover:bg-gray-800 transition-colors text-xs font-bold font-mono" [class]="speed() === 1.0 ? 'border-orange-500 text-orange-400' : 'border-gray-700 text-gray-400'">Normal</button>
                  <button (click)="setSpeed(1.25)" class="px-4 py-2 rounded-lg bg-gray-900 border hover:bg-gray-800 transition-colors text-xs font-bold font-mono" [class]="speed() === 1.25 ? 'border-orange-500 text-orange-400' : 'border-gray-700 text-gray-400'">1.25x</button>
                  <button (click)="setSpeed(1.5)" class="px-4 py-2 rounded-lg bg-gray-900 border hover:bg-gray-800 transition-colors text-xs font-bold font-mono" [class]="speed() === 1.5 ? 'border-orange-500 text-orange-400' : 'border-gray-700 text-gray-400'">1.5x</button>
                  <button (click)="setSpeed(2.0)" class="px-4 py-2 rounded-lg bg-gray-900 border hover:bg-gray-800 transition-colors text-xs font-bold font-mono" [class]="speed() === 2.0 ? 'border-orange-500 text-orange-400' : 'border-gray-700 text-gray-400'">2.0x</button>
                </div>

                <!-- Pitch Lock Toggle -->
                <div class="mt-4 p-5 rounded-xl border transition-colors flex items-start gap-4 cursor-pointer" 
                     [class]="pitchLock() ? 'bg-orange-500/5 border-orange-500/30' : 'bg-gray-900/50 border-gray-800'"
                     (click)="togglePitchLock()"
                     (keydown.enter)="togglePitchLock()"
                     (keydown.space)="togglePitchLock()"
                     tabindex="0"
                     role="checkbox"
                     [attr.aria-checked]="pitchLock()">
                     
                     <div class="w-6 h-6 rounded flex items-center justify-center border transition-colors mt-0.5"
                          [class]="pitchLock() ? 'bg-orange-500 border-orange-400' : 'bg-gray-800 border-gray-600'">
                          @if(pitchLock()) {
                            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                          }
                     </div>
                     <div>
                       <h4 class="text-sm font-bold text-gray-200">Pitch Lock (Time Stretch Algorithm)</h4>
                       <p class="text-[11px] text-gray-500 mt-1 leading-relaxed">
                         If enabled, the audio pitch remains constant exactly like the original. If disabled, increasing speed raises pitch (Vinyl / Chipmunk effect).
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
                  <select [value]="outputFormat()" (change)="onFormatChange($event)" class="w-full bg-gray-900 border border-gray-700 text-white font-bold text-sm rounded-lg px-4 py-3 outline-none focus:border-orange-500 transition-colors mb-6">
                    <option value="wav">WAV (Lossless)</option>
                    <option value="mp3">MP3</option>
                    <option value="aac">AAC</option>
                  </select>
                </div>

                @if (state.status === 'idle' || state.status === 'error') {
                  <div class="flex-1 flex flex-col justify-center opacity-50 text-center mb-6">
                    <div class="w-16 h-16 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center text-gray-600 mx-auto mb-4">
                      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <p class="text-sm font-medium">Ready to Warp Time</p>
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
                      <p class="text-white font-black text-lg mb-1">Time Warped!</p>
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
                        [disabled]="state.status === 'processing' || speed() === 1.0"
                        class="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        [class]="state.status === 'processing' ? 'bg-gray-800 text-orange-500' : 'bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 text-white shadow-[0_0_20px_rgba(249,115,22,0.2)] active:scale-95'">
                        
                        @if (state.status === 'processing') {
                          <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                          Processing...
                        } @else {
                          ⏱️ Process Speed
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
export class TimeStretchComponent implements OnDestroy {
  private store = inject(Store);
  readonly state$ = this.store.select(selectTimeStretchState);
  
  outputFormat = signal<ExportFormat>('wav');
  speed = signal<number>(1.0);
  pitchLock = signal<boolean>(true);

  speedDisplay = computed(() => {
    return this.speed().toFixed(2);
  });

  private cachedBlobUrls = new Map<Blob, string>();

  onFileSelected(files: File[]): void {
    if (files.length > 0) this.store.dispatch(TimeStretchActions.loadFile({ file: files[0] }));
  }

  onSpeedChange(event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    this.speed.set(val);
  }

  setSpeed(val: number): void {
    this.speed.set(val);
  }

  togglePitchLock(): void {
    this.pitchLock.update(v => !v);
  }

  onFormatChange(e: Event) {
    this.outputFormat.set((e.target as HTMLSelectElement).value as ExportFormat);
  }

  onProcess(state: any): void {
    if (state.status === 'processing' || this.speed() === 1.0) return;
    this.store.dispatch(TimeStretchActions.startProcessing({ 
      format: this.outputFormat(),
      speed: this.speed(),
      pitchLock: this.pitchLock()
    }));
  }

  onDownload(state: any): void {
    if (!state.outputBlob) return;
    const url = this.getBlobUrl(state.outputBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omni_speed_${this.speedDisplay()}x_${state.inputFile?.name?.replace(/\.[^.]+$/, '')}.${this.outputFormat()}`;
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
    this.store.dispatch(TimeStretchActions.resetState());
  }

  ngOnDestroy(): void {
    this.onReset();
  }
}
