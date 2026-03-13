import { Component, ChangeDetectionStrategy, inject, OnDestroy, signal, computed } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger } from '@angular/animations';
import { SpeedActions, selectSpeedState } from './speed.store';
import { AudioDropZoneComponent } from '../shared/components/audio-drop-zone/audio-drop-zone.component';
import { ExportFormat } from '../shared/types/audio.types';

@Component({
  selector: 'app-speed',
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
          <h2 class="text-4xl font-black bg-gradient-to-r from-fuchsia-400 to-pink-500 bg-clip-text text-transparent tracking-tight">⚡ Speed Changer</h2>
          <p class="text-gray-400 text-sm mt-1 uppercase tracking-widest">Change playback speed with optional pitch lock</p>
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
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-5 flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 text-xl">⚡</div>
                <div><h3 class="font-bold">{{ state.inputFile.name }}</h3><p class="text-xs text-gray-500 font-mono mt-1">{{ (state.inputFile.size/1024/1024) | number:'1.2-2' }} MB</p></div>
              </div>

              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex-1 flex flex-col gap-6">
                <!-- Speed Presets -->
                <div>
                  <label class="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Speed Preset</label>
                  <div class="grid grid-cols-6 gap-2">
                    @for (p of presets; track p) {
                      <button (click)="speed.set(p)" class="py-3 rounded-xl font-black text-xs border transition-all"
                              [class]="speed() === p ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600'">{{ p }}x</button>
                    }
                  </div>
                </div>

                <!-- Custom Speed Slider -->
                <div class="flex flex-col gap-2">
                  <div class="flex justify-between">
                    <label class="text-sm font-bold text-gray-300">Custom Speed</label>
                    <span class="text-3xl font-black text-fuchsia-400 font-mono">{{ speed() }}x</span>
                  </div>
                  <input type="range" min="0.1" max="4" step="0.05" [value]="speed()" (input)="speed.set(+($event.target as HTMLInputElement).value)"
                        class="w-full accent-fuchsia-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer">
                  <div class="flex justify-between text-[10px] text-gray-600 font-mono"><span>0.1x (super slow)</span><span>1x (original)</span><span>4x (ultra fast)</span></div>
                </div>

                <!-- Pitch Lock Toggle -->
                <div class="bg-gray-900/50 rounded-xl p-4 flex items-center justify-between cursor-pointer border"
                     [class]="pitchLock() ? 'border-fuchsia-500/30' : 'border-gray-700'"
                     (click)="pitchLock.update(v => !v)">
                  <div>
                    <h4 class="font-bold text-sm" [class]="pitchLock() ? 'text-fuchsia-400' : 'text-gray-400'">🎵 Pitch Lock</h4>
                    <p class="text-xs text-gray-500 mt-1">{{ pitchLock() ? 'Original pitch preserved (atempo)' : 'Pitch shifts with speed (chipmunk effect)' }}</p>
                  </div>
                  <div class="w-12 h-7 rounded-full transition-colors" [class]="pitchLock() ? 'bg-fuchsia-500' : 'bg-gray-700'">
                    <div class="w-5 h-5 rounded-full bg-white mt-1 transition-transform" [class]="pitchLock() ? 'translate-x-6' : 'translate-x-1'"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="w-full lg:w-80 flex flex-col gap-6">
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col min-h-[300px]">
                <label class="text-xs text-gray-400 uppercase tracking-widest mb-3 font-bold">Format</label>
                <select [value]="outputFormat()" (change)="outputFormat.set(($event.target as HTMLSelectElement).value as any)"
                        class="w-full bg-gray-900 border border-gray-700 font-bold text-sm rounded-lg px-4 py-3 outline-none focus:border-fuchsia-500 transition-colors mb-6">
                  <option value="mp3">MP3</option><option value="wav">WAV</option><option value="aac">AAC</option>
                </select>

                @if (state.status === 'processing') {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6" [@fadeIn]>
                    <div class="relative w-28 h-28 mb-4">
                      <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100"><circle stroke-width="4" stroke="#1f2937" fill="transparent" r="46" cx="50" cy="50"/><circle class="text-fuchsia-500" stroke-width="4" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50" stroke-dasharray="290" [style.stroke-dashoffset]="290-(290*state.progress)/100" stroke-linecap="round"/></svg>
                      <div class="absolute inset-0 flex items-center justify-center text-xl font-black">{{ state.progress }}%</div>
                    </div>
                    <div class="w-full max-h-20 overflow-y-auto font-mono text-[10px] text-gray-500 bg-black/80 rounded-xl p-2 border border-gray-800">
                      @for (l of state.logs; track $index) { <div><span class="text-fuchsia-400/40">></span> {{ l }}</div> }
                    </div>
                  </div>
                }

                @if (state.status === 'done' && state.outputBlob) {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6 gap-3 text-center" [@slideUp]>
                    <div class="text-3xl">✅</div>
                    <p class="font-black text-lg">{{ speed() }}x Speed Done!</p>
                    <p class="text-sm text-gray-400 font-mono">{{ state.outputSizeMB | number:'1.2-2' }} MB</p>
                    <audio [src]="getBlobUrl(state.outputBlob)" controls class="w-full outline-none mt-2"></audio>
                  </div>
                }

                @if (state.status === 'error') {
                  <div class="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">{{ state.errorMessage }}</div>
                }

                <div class="mt-auto">
                  @if (state.status === 'done') {
                    <button (click)="onDownload(state)" class="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl font-black text-sm uppercase active:scale-95 transition-all">⬇ Download</button>
                  } @else {
                    <button (click)="onProcess(state)" [disabled]="state.status === 'processing'"
                        class="w-full py-4 rounded-xl font-black text-sm uppercase transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        [class]="state.status === 'processing' ? 'bg-gray-800 text-fuchsia-400' : 'bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:opacity-90 active:scale-95 shadow-[0_0_20px_rgba(217,70,239,0.2)]'">
                      @if (state.status === 'processing') { <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Changing... } @else { ⚡ Change Speed }
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
export class SpeedComponent implements OnDestroy {
  private store = inject(Store);
  readonly state$ = this.store.select(selectSpeedState);
  outputFormat = signal<ExportFormat>('mp3');
  speed = signal(1.5);
  pitchLock = signal(true);
  private cachedBlobUrls = new Map<Blob, string>();
  readonly presets = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  onFileSelected(files: File[]) { if (files.length) this.store.dispatch(SpeedActions.loadFile({ file: files[0] })); }
  onProcess(state: any) {
    if (state.status === 'processing') return;
    this.store.dispatch(SpeedActions.startProcessing({ format: this.outputFormat(), speed: this.speed(), pitchLock: this.pitchLock() }));
  }
  getBlobUrl(blob: Blob): string {
    if (!this.cachedBlobUrls.has(blob)) this.cachedBlobUrls.set(blob, URL.createObjectURL(blob));
    return this.cachedBlobUrls.get(blob)!;
  }
  onDownload(state: any) {
    if (!state.outputBlob) return;
    const a = document.createElement('a'); a.href = this.getBlobUrl(state.outputBlob);
    a.download = `omni_${this.speed()}x_${state.inputFile?.name?.replace(/\.[^.]+$/, '')}.${this.outputFormat()}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }
  onReset() { this.cachedBlobUrls.forEach(url => URL.revokeObjectURL(url)); this.cachedBlobUrls.clear(); this.store.dispatch(SpeedActions.resetState()); }
  ngOnDestroy() { this.onReset(); }
}
