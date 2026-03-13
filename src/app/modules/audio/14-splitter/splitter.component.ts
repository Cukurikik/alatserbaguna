import { Component, ChangeDetectionStrategy, inject, OnDestroy, signal } from '@angular/core';
import JSZip from 'jszip';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger } from '@angular/animations';
import { SplitterActions, selectSplitterState } from './splitter.store';
import { AudioDropZoneComponent } from '../shared/components/audio-drop-zone/audio-drop-zone.component';
import { ExportFormat } from '../shared/types/audio.types';

@Component({
  selector: 'app-splitter',
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
          <h2 class="text-4xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent tracking-tight">
            ✂️ Audio Splitter
          </h2>
          <p class="text-gray-400 text-sm mt-1 uppercase tracking-widest">Split by equal parts or silence detection</p>
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
                  <div class="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 text-2xl">✂️</div>
                  <div>
                    <h3 class="font-bold text-lg">{{ state.inputFile.name }}</h3>
                    <p class="text-xs text-gray-500 font-mono mt-1">{{ (state.inputFile.size / 1024 / 1024) | number:'1.2-2' }} MB</p>
                  </div>
                </div>
              </div>

              <!-- Mode Selection + Controls -->
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col gap-6 flex-1">
                <h3 class="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-4">Split Mode</h3>

                <div class="flex gap-4">
                  <button (click)="mode.set('equal')" class="flex-1 p-4 rounded-xl border text-left transition-colors" [class]="mode() === 'equal' ? 'bg-amber-500/10 border-amber-500/40' : 'bg-gray-900/50 border-gray-800 hover:border-gray-600'">
                    <div class="text-lg mb-1">📐</div>
                    <h4 class="font-bold text-sm" [class]="mode() === 'equal' ? 'text-amber-400' : 'text-gray-300'">Equal Parts</h4>
                    <p class="text-xs text-gray-500 mt-1">Divide into N equal-duration segments.</p>
                  </button>
                  <button (click)="mode.set('silence')" class="flex-1 p-4 rounded-xl border text-left transition-colors" [class]="mode() === 'silence' ? 'bg-amber-500/10 border-amber-500/40' : 'bg-gray-900/50 border-gray-800 hover:border-gray-600'">
                    <div class="text-lg mb-1">🔇</div>
                    <h4 class="font-bold text-sm" [class]="mode() === 'silence' ? 'text-amber-400' : 'text-gray-300'">Silence Detection</h4>
                    <p class="text-xs text-gray-500 mt-1">Auto-split at quiet moments.</p>
                  </button>
                </div>

                @if (mode() === 'equal') {
                  <div class="flex flex-col gap-3" [@fadeIn]>
                    <div class="flex justify-between items-center">
                      <label class="text-sm font-bold text-gray-300">Number of Parts</label>
                      <div class="flex items-center gap-2">
                        <button (click)="decreaseParts()" class="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center font-bold transition-all active:scale-95">-</button>
                      <input type="number" min="2" max="10" [value]="equalParts()" (change)="onEqualPartsChange($event)"
                             class="w-16 bg-gray-900 border-none text-center font-black text-amber-400 outline-none">
                      <button (click)="increaseParts()" class="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center font-bold transition-all active:scale-95">+</button>
                      </div>
                    </div>
                    <input type="range" min="2" max="50" step="1" [value]="equalParts()" (input)="onEqualPartsChange($event)" class="w-full accent-amber-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer">
                    <div class="flex gap-2">
                      @for (preset of [2, 4, 8, 10]; track preset) {
                        <button (click)="equalParts.set(preset)" class="flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors" [class]="equalParts() === preset ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-gray-900 border-gray-700 text-gray-400'">{{ preset }}</button>
                      }
                    </div>
                  </div>
                }

                @if (mode() === 'silence') {
                  <div class="flex flex-col gap-6" [@fadeIn]>
                    <div class="flex flex-col gap-2">
                      <div class="flex justify-between">
                        <label class="text-sm font-bold text-gray-300">Silence Threshold</label>
                        <span class="text-sm font-mono text-amber-400 font-bold">{{ silenceThresholdDb() }} dB</span>
                      </div>
                      <input type="range" min="-80" max="-20" step="1" [value]="silenceThresholdDb()" (input)="onThresholdChange($event)" class="w-full accent-amber-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer">
                      <p class="text-xs text-gray-500">Audio must drop below this level to be detected as silence.</p>
                    </div>
                    <div class="flex flex-col gap-2">
                      <div class="flex justify-between">
                        <label class="text-sm font-bold text-gray-300">Minimum Silence Duration</label>
                        <span class="text-sm font-mono text-amber-400 font-bold">{{ silenceMinDuration() }}s</span>
                      </div>
                      <input type="range" min="0.1" max="5" step="0.1" [value]="silenceMinDuration()" (input)="onSilenceDurChange($event)" class="w-full accent-amber-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer">
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Right Panel -->
            <div class="w-full lg:w-96 flex flex-col gap-6">
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col min-h-[400px]">
                <label class="text-xs text-gray-400 uppercase tracking-widest mb-3 font-bold">Output Format</label>
                <select [value]="outputFormat()" (change)="onFormatChange($event)" class="w-full bg-gray-900 border border-gray-700 text-white font-bold text-sm rounded-lg px-4 py-3 outline-none focus:border-amber-500 transition-colors mb-6">
                  <option value="wav">WAV (Lossless)</option>
                  <option value="mp3">MP3</option>
                  <option value="aac">AAC</option>
                </select>

                @if (state.status === 'processing') {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6" [@fadeIn]>
                    <div class="relative w-32 h-32 mb-6">
                      <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle stroke-width="4" stroke="#1f2937" fill="transparent" r="46" cx="50" cy="50" />
                        <circle class="text-amber-500 transition-all duration-300" stroke-width="4" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50"
                                stroke-dasharray="290" [style.stroke-dashoffset]="290 - (290 * state.progress) / 100" stroke-linecap="round" />
                      </svg>
                      <div class="absolute inset-0 flex items-center justify-center"><span class="text-2xl font-black">{{ state.progress }}%</span></div>
                    </div>
                    <div class="w-full h-20 bg-black/80 rounded-xl border border-gray-800 p-3 overflow-y-auto font-mono text-[10px] text-gray-500">
                      @for (log of state.logs; track $index) { <div><span class="text-amber-400/50">></span> {{ log }}</div> }
                    </div>
                  </div>
                }

                @if (state.status === 'done' && state.outputBlobs.length > 0) {
                  <div class="flex-1 flex flex-col mb-6 gap-3" [@slideUp]>
                    <div class="flex items-center gap-3 mb-2">
                      <div class="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-xl">✅</div>
                      <div>
                        <p class="font-black text-white">{{ state.segmentCount }} Segments Ready</p>
                        <p class="text-xs text-gray-500">Download individually or all at once</p>
                      </div>
                    </div>
                    <div class="max-h-48 overflow-y-auto flex flex-col gap-2">
                      @for (blob of state.outputBlobs; track $index) {
                        <div class="flex items-center justify-between bg-gray-900 rounded-lg px-3 py-2 border border-gray-800">
                          <span class="text-xs font-mono text-gray-400">Segment {{ $index + 1 }} — {{ (blob.size / 1024) | number:'1.0-0' }} KB</span>
                          <button (click)="downloadOne(blob, $index, state)" class="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors">↓</button>
                        </div>
                      }
                    </div>
                  </div>
                }

                @if (state.status === 'error') {
                  <div class="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm" [@fadeIn]>
                    <span class="font-bold">Error:</span> {{ state.errorMessage }}
                  </div>
                }

                <div class="mt-auto flex flex-col gap-3">
                  @if (state.status === 'done') {
                    <button (click)="downloadAll(state)" class="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-90 text-white rounded-xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all">⬇ Download All (ZIP)</button>
                  }
                  @if (state.status !== 'done') {
                    <button (click)="onProcess(state)" [disabled]="state.status === 'processing'"
                        class="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        [class]="state.status === 'processing' ? 'bg-gray-800 text-amber-400' : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white shadow-[0_0_20px_rgba(245,158,11,0.2)] active:scale-95'">
                      @if (state.status === 'processing') {
                        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                        Splitting...
                      } @else { ✂️ Split Audio }
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
export class SplitterComponent implements OnDestroy {
  private store = inject(Store);
  readonly state$ = this.store.select(selectSplitterState);
  outputFormat = signal<ExportFormat>('wav');
  mode = signal<'equal' | 'silence'>('equal');
  equalParts = signal<number>(2);
  silenceThresholdDb = signal<number>(-40);
  silenceMinDuration = signal<number>(0.5);
  private cachedBlobUrls = new Map<Blob, string>();

  protected readonly Math = Math;

  decreaseParts() { this.equalParts.update(v => Math.max(2, v - 1)); }
  increaseParts() { this.equalParts.update(v => Math.min(10, v + 1)); }

  onFileSelected(files: File[]) { if (files.length) this.store.dispatch(SplitterActions.loadFile({ file: files[0] })); }
  onEqualPartsChange(e: Event) { this.equalParts.set(parseInt((e.target as any).value, 10)); }
  onThresholdChange(e: Event) { this.silenceThresholdDb.set(parseInt((e.target as any).value, 10)); }
  onSilenceDurChange(e: Event) { this.silenceMinDuration.set(parseFloat((e.target as any).value)); }
  onFormatChange(e: Event) { this.outputFormat.set((e.target as any).value as ExportFormat); }

  onProcess(state: any) {
    if (state.status === 'processing') return;
    this.store.dispatch(SplitterActions.startProcessing({
      format: this.outputFormat(), mode: this.mode(), equalParts: this.equalParts(),
      silenceThresholdDb: this.silenceThresholdDb(), silenceMinDurationSec: this.silenceMinDuration()
    }));
  }

  getBlobUrl(blob: Blob): string {
    if (this.cachedBlobUrls.has(blob)) return this.cachedBlobUrls.get(blob)!;
    const url = URL.createObjectURL(blob); this.cachedBlobUrls.set(blob, url); return url;
  }

  downloadOne(blob: Blob, index: number, state: any) {
    const a = document.createElement('a');
    a.href = this.getBlobUrl(blob);
    a.download = `omni_split_${index + 1}_${state.inputFile?.name?.replace(/\.[^.]+$/, '')}.${this.outputFormat()}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  async downloadAll(state: any) {
    // Use JSZip via dynamic import to bundle all blobs
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    const baseName = state.inputFile?.name?.replace(/\.[^.]+$/, '') ?? 'omni_output';
    state.outputBlobs.forEach((blob: Blob, i: number) => {
      zip.file(`${baseName}_part${i + 1}.${this.outputFormat()}`, blob);
    });
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url; a.download = `${baseName}_split.zip`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 150);
  }

  onReset() { this.cachedBlobUrls.forEach(url => URL.revokeObjectURL(url)); this.cachedBlobUrls.clear(); this.store.dispatch(SplitterActions.resetState()); }
  ngOnDestroy() { this.onReset(); }
}
