import { Component, ChangeDetectionStrategy, inject, OnDestroy, signal } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger } from '@angular/animations';
import { StereoWidenerActions, selectStereoWidenerState } from './stereo-widener.store';
import { AudioDropZoneComponent } from '../shared/components/audio-drop-zone/audio-drop-zone.component';
import { ExportFormat } from '../shared/types/audio.types';

@Component({
  selector: 'app-stereo-widener',
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
          <h2 class="text-4xl font-black bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent tracking-tight">↔️ Stereo Widener</h2>
          <p class="text-gray-400 text-sm mt-1 uppercase tracking-widest">Enhance or narrow stereo width using Mid-Side processing</p>
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
                <div class="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-xl">↔️</div>
                <div><h3 class="font-bold">{{ state.inputFile.name }}</h3><p class="text-xs text-gray-500 font-mono mt-1">{{ (state.inputFile.size/1024/1024) | number:'1.2-2' }} MB</p></div>
              </div>

              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex-1 flex flex-col gap-8">
                <!-- Mode -->
                <div>
                  <label class="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Algorithm</label>
                  <div class="grid grid-cols-2 gap-3">
                    <button (click)="mode.set('extrastereo')" class="p-4 rounded-xl border text-left transition-all"
                            [class]="mode() === 'extrastereo' ? 'bg-blue-500/10 border-blue-500/40' : 'bg-gray-900 border-gray-800 hover:border-gray-600'">
                      <div class="text-xl mb-1">📡</div>
                      <p class="text-sm font-bold" [class]="mode() === 'extrastereo' ? 'text-blue-400' : 'text-gray-300'">Extra Stereo</p>
                      <p class="text-[10px] text-gray-500 mt-1">Scales L/R difference. Simpler, faster.</p>
                    </button>
                    <button (click)="mode.set('stereotools')" class="p-4 rounded-xl border text-left transition-all"
                            [class]="mode() === 'stereotools' ? 'bg-cyan-500/10 border-cyan-500/40' : 'bg-gray-900 border-gray-800 hover:border-gray-600'">
                      <div class="text-xl mb-1">🎛️</div>
                      <p class="text-sm font-bold" [class]="mode() === 'stereotools' ? 'text-cyan-400' : 'text-gray-300'">Stereo Tools</p>
                      <p class="text-[10px] text-gray-500 mt-1">Mid-Side processing. More precise.</p>
                    </button>
                  </div>
                </div>

                <!-- Width Slider + Visual -->
                <div class="flex flex-col gap-4">
                  <div class="flex justify-between">
                    <label class="text-sm font-bold text-gray-300">Stereo Width</label>
                    <span class="font-black text-xl font-mono" [class]="width() < 0.8 ? 'text-gray-400' : width() > 1.5 ? 'text-cyan-400' : 'text-blue-400'">{{ getWidthLabel() }}</span>
                  </div>

                  <!-- Visual stereo width indicator -->
                  <div class="relative h-16 bg-gray-900/60 rounded-xl border border-gray-800 overflow-hidden flex items-center justify-center px-4">
                    <div class="absolute inset-0 flex items-center justify-center gap-0.5">
                      <div class="h-12 bg-blue-500/20 transition-all rounded-l-lg" [style.width.%]="getWidthBarLeft()"></div>
                      <div class="w-0.5 h-full bg-gray-700"></div>
                      <div class="h-12 bg-cyan-500/20 transition-all rounded-r-lg" [style.width.%]="getWidthBarRight()"></div>
                    </div>
                    <span class="absolute left-4 text-[9px] text-gray-600 font-mono">L</span>
                    <span class="absolute right-4 text-[9px] text-gray-600 font-mono">R</span>
                  </div>

                  <input type="range" min="0" max="2" step="0.05" [value]="width()" (input)="width.set(+($event.target as HTMLInputElement).value)"
                        class="w-full accent-blue-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer">

                  <div class="flex gap-2">
                    @for (p of [[0,'Mono'],[0.5,'Narrow'],[1,'Original'],[1.5,'Wide'],[2,'Max']]; track p[0]) {
                      <button (click)="width.set(+p[0])" class="flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition-colors"
                              [class]="width() === +p[0] ? 'bg-blue-500/10 border-blue-500/40 text-blue-400' : 'bg-gray-900 border-gray-700 text-gray-500'">{{ p[1] }}</button>
                    }
                  </div>
                </div>
              </div>
            </div>

            <div class="w-full lg:w-80 flex flex-col gap-6">
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col min-h-[300px]">
                <label class="text-xs text-gray-400 uppercase tracking-widest mb-3 font-bold">Format</label>
                <select [value]="outputFormat()" (change)="outputFormat.set(($event.target as HTMLSelectElement).value as any)"
                        class="w-full bg-gray-900 border border-gray-700 font-bold text-sm rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-colors mb-6">
                  <option value="wav">WAV</option><option value="mp3">MP3</option><option value="aac">AAC</option>
                </select>

                @if (state.status === 'processing') {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6" [@fadeIn]>
                    <div class="relative w-24 h-24 mb-4">
                      <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100"><circle stroke-width="4" stroke="#1f2937" fill="transparent" r="46" cx="50" cy="50"/><circle class="text-blue-500" stroke-width="4" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50" stroke-dasharray="290" [style.stroke-dashoffset]="290-(290*state.progress)/100" stroke-linecap="round"/></svg>
                      <div class="absolute inset-0 flex items-center justify-center text-lg font-black">{{ state.progress }}%</div>
                    </div>
                  </div>
                }

                @if (state.status === 'done' && state.outputBlob) {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6 gap-3 text-center" [@slideUp]>
                    <div class="text-3xl">✅</div>
                    <p class="font-black text-lg">Widened!</p>
                    <p class="text-sm text-gray-400 font-mono">{{ state.outputSizeMB | number:'1.2-2' }} MB</p>
                    <audio [src]="getBlobUrl(state.outputBlob)" controls class="w-full outline-none mt-2"></audio>
                  </div>
                }

                @if (state.status === 'error') { <div class="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">{{ state.errorMessage }}</div> }

                <div class="mt-auto">
                  @if (state.status === 'done') {
                    <button (click)="onDownload(state)" class="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl font-black text-sm uppercase active:scale-95 transition-all">⬇ Download</button>
                  } @else {
                    <button (click)="onProcess(state)" [disabled]="state.status === 'processing'"
                        class="w-full py-4 rounded-xl font-black text-sm uppercase transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        [class]="state.status === 'processing' ? 'bg-gray-800 text-blue-400' : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 active:scale-95 shadow-[0_0_20px_rgba(59,130,246,0.2)]'">
                      @if (state.status === 'processing') { <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Widening... } @else { ↔️ Apply Widening }
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
export class StereoWidenerComponent implements OnDestroy {
  private store = inject(Store);
  readonly state$ = this.store.select(selectStereoWidenerState);
  outputFormat = signal<ExportFormat>('wav');
  width = signal(1.5);
  mode = signal<'stereotools' | 'extrastereo'>('extrastereo');
  private cachedBlobUrls = new Map<Blob, string>();

  onFileSelected(files: File[]) { if (files.length) this.store.dispatch(StereoWidenerActions.loadFile({ file: files[0] })); }
  onProcess(state: any) {
    if (state.status === 'processing') return;
    this.store.dispatch(StereoWidenerActions.startProcessing({ format: this.outputFormat(), width: this.width(), mode: this.mode() }));
  }
  getWidthLabel(): string {
    const w = this.width();
    if (w <= 0.05) return 'Mono';
    if (w < 0.8) return `Narrow ${(w * 100).toFixed(0)}%`;
    if (w < 1.1) return 'Original';
    return `Wide ${(w * 100).toFixed(0)}%`;
  }
  getWidthBarLeft(): number { return Math.min(50, (this.width() / 2) * 50); }
  getWidthBarRight(): number { return Math.min(50, (this.width() / 2) * 50); }
  getBlobUrl(blob: Blob): string {
    if (!this.cachedBlobUrls.has(blob)) this.cachedBlobUrls.set(blob, URL.createObjectURL(blob));
    return this.cachedBlobUrls.get(blob)!;
  }
  onDownload(state: any) {
    if (!state.outputBlob) return;
    const a = document.createElement('a'); a.href = this.getBlobUrl(state.outputBlob);
    a.download = `omni_wide_${this.width()}x_${state.inputFile?.name?.replace(/\.[^.]+$/, '')}.${this.outputFormat()}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }
  onReset() { this.cachedBlobUrls.forEach(url => URL.revokeObjectURL(url)); this.cachedBlobUrls.clear(); this.store.dispatch(StereoWidenerActions.resetState()); }
  ngOnDestroy() { this.onReset(); }
}
