import { Component, ChangeDetectionStrategy, inject, OnDestroy, signal, computed } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger } from '@angular/animations';
import { NoiseRemoverActions, selectNoiseRemoverState } from './noise-remover.store';
import { AudioDropZoneComponent } from '../shared/components/audio-drop-zone/audio-drop-zone.component';
import { ExportFormat } from '../shared/types/audio.types';

@Component({
  selector: 'app-noise-remover',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, DecimalPipe, AudioDropZoneComponent],
  animations: [
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0 }), animate('400ms ease-out', style({ opacity: 1 }))])]),
    trigger('slideUp', [transition(':enter', [style({ opacity: 0, transform: 'translateY(20px)' }), animate('500ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0)' }))])]),
  ],
  template: `
    <div class="h-full w-full bg-[#0a0a0f] text-white p-6 flex flex-col overflow-y-auto" [@fadeIn]>
      <div class="flex justify-between items-center mb-8">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent tracking-tight">
            🎙️ Noise Remover
          </h2>
          <p class="text-gray-400 text-sm mt-1 uppercase tracking-widest">Adaptive frequency denoiser powered by FFmpeg afftdn</p>
        </div>
        @if ((state$ | async)?.inputFile) {
          <button (click)="onReset()" class="px-4 py-2 bg-gray-900 hover:bg-red-900/40 text-gray-400 hover:text-red-400 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors border border-gray-800">Reset</button>
        }
      </div>

      @if (state$ | async; as state) {
        @if (!state.inputFile) {
          <div class="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full py-12" [@slideUp]>
            <app-audio-drop-zone (fileSelected)="onFileSelected($event)"></app-audio-drop-zone>
          </div>
        } @else {
          <div class="flex-1 flex flex-col lg:flex-row gap-6" [@fadeIn]>
            <div class="flex-1 flex flex-col gap-6">
              <!-- File card -->
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400 text-2xl">🎤</div>
                  <div>
                    <h3 class="font-bold text-lg">{{ state.inputFile.name }}</h3>
                    <p class="text-xs text-gray-500 font-mono mt-1">{{ (state.inputFile.size / 1024 / 1024) | number:'1.2-2' }} MB</p>
                  </div>
                </div>
              </div>

              <!-- Controls -->
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col gap-8 flex-1">
                <h3 class="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-4">Denoiser Settings</h3>

                <!-- Strength -->
                <div class="flex flex-col gap-3">
                  <div class="flex justify-between items-center">
                    <label class="text-sm font-bold text-gray-300">Reduction Strength</label>
                    <span class="text-lg text-green-400 font-mono font-black">{{ strength() }} <span class="text-xs text-gray-500">dB</span></span>
                  </div>
                  <input type="range" min="0" max="97" step="1" [value]="strength()" (input)="onStrengthChange($event)" class="w-full accent-green-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer">
                  <div class="flex justify-between text-[10px] font-mono font-bold text-gray-600">
                    <span>Light</span><span>Medium</span><span>Aggressive</span>
                  </div>
                  <!-- Presets -->
                  <div class="flex gap-2 flex-wrap">
                    <button (click)="strength.set(20)" class="px-3 py-1.5 text-[10px] font-bold rounded-lg border" [class]="strength() === 20 ? 'bg-green-500/10 border-green-500/40 text-green-400' : 'bg-gray-900 border-gray-700 text-gray-400'">Light (20)</button>
                    <button (click)="strength.set(50)" class="px-3 py-1.5 text-[10px] font-bold rounded-lg border" [class]="strength() === 50 ? 'bg-green-500/10 border-green-500/40 text-green-400' : 'bg-gray-900 border-gray-700 text-gray-400'">Medium (50)</button>
                    <button (click)="strength.set(75)" class="px-3 py-1.5 text-[10px] font-bold rounded-lg border" [class]="strength() === 75 ? 'bg-green-500/10 border-green-500/40 text-green-400' : 'bg-gray-900 border-gray-700 text-gray-400'">Heavy (75)</button>
                    <button (click)="strength.set(97)" class="px-3 py-1.5 text-[10px] font-bold rounded-lg border" [class]="strength() === 97 ? 'bg-green-500/10 border-green-500/40 text-green-400' : 'bg-gray-900 border-gray-700 text-gray-400'">Max (97)</button>
                  </div>
                </div>

                <!-- Noise Floor -->
                <div class="flex flex-col gap-3">
                  <div class="flex justify-between items-center">
                    <label class="text-sm font-bold text-gray-300">Noise Floor</label>
                    <span class="text-lg text-gray-300 font-mono font-black">{{ noiseFloor() }} <span class="text-xs text-gray-500">dBFS</span></span>
                  </div>
                  <input type="range" min="-100" max="-20" step="1" [value]="noiseFloor()" (input)="onNoiseFloorChange($event)" class="w-full accent-emerald-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer">
                  <p class="text-xs text-gray-500">Estimated floor of the background noise in your recording. Lower = quieter background.</p>
                </div>
              </div>
            </div>

            <!-- Right Panel -->
            <div class="w-full lg:w-96 flex flex-col gap-6">
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col min-h-[400px]">
                <label class="block text-xs text-gray-400 uppercase tracking-widest mb-3 font-bold">Output Format</label>
                <select [value]="outputFormat()" (change)="onFormatChange($event)" class="w-full bg-gray-900 border border-gray-700 text-white font-bold text-sm rounded-lg px-4 py-3 outline-none focus:border-green-500 transition-colors mb-6">
                  <option value="wav">WAV (Lossless)</option>
                  <option value="mp3">MP3</option>
                  <option value="aac">AAC</option>
                </select>

                @if (state.status === 'processing') {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6" [@fadeIn]>
                    <div class="relative w-32 h-32 mb-6">
                      <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle stroke-width="4" stroke="#1f2937" fill="transparent" r="46" cx="50" cy="50" />
                        <circle class="text-green-500 transition-all duration-300" stroke-width="4" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50"
                                stroke-dasharray="290" [style.stroke-dashoffset]="290 - (290 * state.progress) / 100" stroke-linecap="round" />
                      </svg>
                      <div class="absolute inset-0 flex items-center justify-center"><span class="text-2xl font-black">{{ state.progress }}%</span></div>
                    </div>
                    <div class="w-full h-20 bg-black/80 rounded-xl border border-gray-800 p-3 overflow-y-auto font-mono text-[10px] text-gray-500">
                      @for (log of state.logs; track $index) { <div><span class="text-green-500/50">></span> {{ log }}</div> }
                    </div>
                  </div>
                }

                @if (state.status === 'done' && state.outputBlob) {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6 gap-4 text-center" [@slideUp]>
                    <div class="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-3xl">✅</div>
                    <p class="font-black text-lg">Noise Removed!</p>
                    <p class="text-emerald-400 text-xs font-mono">{{ state.outputSizeMB | number:'1.2-2' }} MB</p>
                    <audio [src]="getBlobUrl(state.outputBlob)" controls class="w-full mt-2 outline-none"></audio>
                  </div>
                }

                @if (state.status === 'error') {
                  <div class="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm" [@fadeIn]>
                    <span class="font-bold">Error:</span> {{ state.errorMessage }}
                  </div>
                }

                <div class="mt-auto">
                  @if (state.status === 'done') {
                    <button (click)="onDownload(state)" class="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-90 text-white rounded-xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all">Download Audio</button>
                  } @else {
                    <button (click)="onProcess(state)" [disabled]="state.status === 'processing'"
                        class="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        [class]="state.status === 'processing' ? 'bg-gray-800 text-green-500' : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 text-white shadow-[0_0_20px_rgba(34,197,94,0.2)] active:scale-95'">
                      @if (state.status === 'processing') {
                        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                        Denoising...
                      } @else { 🎙️ Remove Noise }
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
export class NoiseRemoverComponent implements OnDestroy {
  private store = inject(Store);
  readonly state$ = this.store.select(selectNoiseRemoverState);
  outputFormat = signal<ExportFormat>('wav');
  strength = signal<number>(50);
  noiseFloor = signal<number>(-25);
  private cachedBlobUrls = new Map<Blob, string>();

  onFileSelected(files: File[]) { if (files.length) this.store.dispatch(NoiseRemoverActions.loadFile({ file: files[0] })); }
  onStrengthChange(e: Event) { this.strength.set(parseInt((e.target as any).value, 10)); }
  onNoiseFloorChange(e: Event) { this.noiseFloor.set(parseInt((e.target as any).value, 10)); }
  onFormatChange(e: Event) { this.outputFormat.set((e.target as any).value as ExportFormat); }

  onProcess(state: any) {
    if (state.status === 'processing') return;
    this.store.dispatch(NoiseRemoverActions.startProcessing({ format: this.outputFormat(), strength: this.strength(), noiseFloor: this.noiseFloor() }));
  }

  onDownload(state: any) {
    if (!state.outputBlob) return;
    const a = document.createElement('a');
    a.href = this.getBlobUrl(state.outputBlob);
    a.download = `omni_denoised_${state.inputFile?.name?.replace(/\.[^.]+$/, '')}.${this.outputFormat()}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  getBlobUrl(blob: Blob): string {
    if (this.cachedBlobUrls.has(blob)) return this.cachedBlobUrls.get(blob)!;
    const url = URL.createObjectURL(blob);
    this.cachedBlobUrls.set(blob, url);
    return url;
  }

  onReset() { this.cachedBlobUrls.forEach(url => URL.revokeObjectURL(url)); this.cachedBlobUrls.clear(); this.store.dispatch(NoiseRemoverActions.resetState()); }
  ngOnDestroy() { this.onReset(); }
}
