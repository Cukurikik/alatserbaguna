import { Component, ChangeDetectionStrategy, inject, OnDestroy, signal } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger } from '@angular/animations';
import { WatermarkActions, selectWatermarkState } from './watermark.store';
import { AudioDropZoneComponent } from '../shared/components/audio-drop-zone/audio-drop-zone.component';
import { ExportFormat } from '../shared/types/audio.types';
import { WatermarkMode } from './watermark.schema';

@Component({
  selector: 'app-watermark',
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
          <h2 class="text-4xl font-black bg-gradient-to-r from-indigo-400 to-blue-500 bg-clip-text text-transparent tracking-tight">🔏 Audio Watermark</h2>
          <p class="text-gray-400 text-sm mt-1 uppercase tracking-widest">Embed invisible digital watermarks for copyright protection</p>
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
                <div class="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-xl">🔏</div>
                <div><h3 class="font-bold">{{ state.inputFile.name }}</h3><p class="text-xs text-gray-500 font-mono mt-1">{{ (state.inputFile.size/1024/1024) | number:'1.2-2' }} MB</p></div>
              </div>

              <!-- Mode Toggle -->
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col gap-6 flex-1">
                <div class="flex gap-3">
                  <button (click)="mode.set('embed')" class="flex-1 py-3 rounded-xl border font-bold text-sm transition-all"
                          [class]="mode() === 'embed' ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-400' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'">
                    🔒 Embed
                  </button>
                  <button (click)="mode.set('detect')" class="flex-1 py-3 rounded-xl border font-bold text-sm transition-all"
                          [class]="mode() === 'detect' ? 'bg-blue-500/15 border-blue-500/50 text-blue-400' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'">
                    🔍 Detect
                  </button>
                </div>

                @if (mode() === 'embed') {
                  <div class="flex flex-col gap-4" [@fadeIn]>
                    <div>
                      <label class="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">Watermark Text</label>
                      <input type="text" maxlength="128" placeholder="© 2025 Your Name / Copyright ID"
                             [value]="watermarkText()"
                             (input)="watermarkText.set(($event.target as HTMLInputElement).value)"
                             class="w-full bg-gray-900 border border-gray-700 focus:border-indigo-500 text-white font-mono text-sm rounded-xl px-4 py-3 outline-none transition-colors">
                      <p class="text-[10px] text-gray-500 mt-1">{{ watermarkText().length }}/128 chars</p>
                    </div>

                    <div class="flex flex-col gap-2">
                      <div class="flex justify-between">
                        <label class="text-sm font-bold text-gray-300">Strength</label>
                        <div class="flex flex-col items-end">
                          <span class="text-indigo-400 font-mono font-black text-sm">{{ (strength() * 100).toFixed(0) }}%</span>
                          <span class="text-[9px] text-gray-500">{{ strength() < 0.4 ? 'Imperceptible' : strength() < 0.7 ? 'Balanced' : 'Robust' }}</span>
                        </div>
                      </div>
                      <input type="range" min="0.1" max="1.0" step="0.05" [value]="strength()" (input)="strength.set(+($event.target as HTMLInputElement).value)"
                            class="w-full accent-indigo-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer">
                    </div>

                    <div class="bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-xs text-gray-400 font-mono">
                      <p class="font-bold text-indigo-400 mb-1">Algorithm: LSB Spread Spectrum</p>
                      <p>Modifies least-significant bits of audio samples at deterministic positions. Inaudible change ≈ 0.003% amplitude difference.</p>
                    </div>
                  </div>
                } @else {
                  <div class="flex flex-col items-center justify-center flex-1 gap-4 text-center py-8" [@fadeIn]>
                    <div class="text-4xl">🔍</div>
                    <p class="text-sm text-gray-400">Drop a watermarked audio file above, then click Detect to extract the embedded text.</p>
                    @if (state.status === 'done') {
                      @if (state.detectedText) {
                        <div class="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 text-left" [@slideUp]>
                          <p class="text-xs text-emerald-400 font-black uppercase tracking-widest mb-2">✅ Watermark Detected!</p>
                          <p class="font-mono text-white text-sm break-all">{{ state.detectedText }}</p>
                          <p class="text-[10px] text-gray-500 mt-2">Confidence: {{ state.detectionConfidence !== null ? (state.detectionConfidence * 100).toFixed(0) + '%' : '—' }}</p>
                        </div>
                      } @else {
                        <div class="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 text-center" [@slideUp]>
                          <p class="text-sm font-bold text-amber-400">⚠️ No watermark found</p>
                          <p class="text-xs text-gray-500 mt-1">This file may not contain an Omni-Tool watermark.</p>
                        </div>
                      }
                    }
                  </div>
                }
              </div>
            </div>

            <div class="w-full lg:w-80 flex flex-col gap-6">
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col min-h-[260px]">
                @if (mode() === 'embed') {
                  <label class="text-xs text-gray-400 uppercase tracking-widest mb-3 font-bold">Output Format</label>
                  <select [value]="outputFormat()" (change)="outputFormat.set(($event.target as HTMLSelectElement).value as any)"
                          class="w-full bg-gray-900 border border-gray-700 font-bold text-sm rounded-lg px-4 py-3 outline-none focus:border-indigo-500 transition-colors mb-6">
                    <option value="wav">WAV (Lossless — recommended)</option>
                  </select>
                }

                @if (state.status === 'processing') {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6" [@fadeIn]>
                    <div class="relative w-24 h-24 mb-4">
                      <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100"><circle stroke-width="4" stroke="#1f2937" fill="transparent" r="46" cx="50" cy="50"/><circle class="text-indigo-500" stroke-width="4" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50" stroke-dasharray="290" [style.stroke-dashoffset]="290-(290*state.progress)/100" stroke-linecap="round"/></svg>
                      <div class="absolute inset-0 flex items-center justify-center text-lg font-black">{{ state.progress }}%</div>
                    </div>
                  </div>
                }

                @if (state.status === 'done' && mode() === 'embed' && state.outputBlob) {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6 gap-3 text-center" [@slideUp]>
                    <div class="text-3xl">🔏</div>
                    <p class="font-black text-lg">Watermarked!</p>
                    <audio [src]="getBlobUrl(state.outputBlob)" controls class="w-full outline-none mt-2"></audio>
                  </div>
                }

                @if (state.status === 'error') { <div class="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">{{ state.errorMessage }}</div> }

                <div class="mt-auto">
                  @if (state.status === 'done' && mode() === 'embed' && state.outputBlob) {
                    <button (click)="onDownload(state)" class="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl font-black text-sm uppercase active:scale-95 transition-all mb-2">⬇ Download</button>
                    <button (click)="store.dispatch(WatermarkActions.resetState())" class="w-full py-2 bg-gray-800 rounded-xl font-bold text-xs uppercase text-gray-400 transition-all hover:bg-gray-700">New File</button>
                  } @else {
                    <button (click)="onProcess(state)" [disabled]="state.status === 'processing'"
                        class="w-full py-4 rounded-xl font-black text-sm uppercase transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        [class]="state.status === 'processing' ? 'bg-gray-800 text-indigo-400' : 'bg-gradient-to-r from-indigo-500 to-blue-500 hover:opacity-90 active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.2)]'">
                      @if (state.status === 'processing') { <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Working... } @else { {{ mode() === 'embed' ? '🔒 Embed Watermark' : '🔍 Detect Watermark' }} }
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
export class WatermarkComponent implements OnDestroy {
  protected store = inject(Store);
  readonly state$ = this.store.select(selectWatermarkState);
  outputFormat = signal<ExportFormat>('wav');
  mode = signal<WatermarkMode>('embed');
  watermarkText = signal('');
  strength = signal(0.5);
  readonly WatermarkActions = WatermarkActions;
  private cachedBlobUrls = new Map<Blob, string>();

  onFileSelected(files: File[]) { if (files.length) this.store.dispatch(WatermarkActions.loadFile({ file: files[0] })); }
  onProcess(state: any) {
    if (state.status === 'processing') return;
    this.store.dispatch(WatermarkActions.startProcessing({ format: this.outputFormat(), mode: this.mode(), watermarkText: this.watermarkText(), strength: this.strength() }));
  }
  getBlobUrl(blob: Blob): string {
    if (!this.cachedBlobUrls.has(blob)) this.cachedBlobUrls.set(blob, URL.createObjectURL(blob));
    return this.cachedBlobUrls.get(blob)!;
  }
  onDownload(state: any) {
    if (!state.outputBlob) return;
    const a = document.createElement('a'); a.href = this.getBlobUrl(state.outputBlob);
    a.download = `omni_watermarked_${state.inputFile?.name?.replace(/\.[^.]+$/, '')}.wav`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }
  onReset() { this.cachedBlobUrls.forEach(url => URL.revokeObjectURL(url)); this.cachedBlobUrls.clear(); this.store.dispatch(WatermarkActions.resetState()); }
  ngOnDestroy() { this.onReset(); }
}
