import { Component, ChangeDetectionStrategy, inject, OnDestroy, signal } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger } from '@angular/animations';
import { SilenceRemoverActions, selectSilenceRemoverState } from './silence-remover.store';
import { AudioDropZoneComponent } from '../shared/components/audio-drop-zone/audio-drop-zone.component';
import { ExportFormat } from '../shared/types/audio.types';

@Component({
  selector: 'app-silence-remover',
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
          <h2 class="text-4xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent tracking-tight">🔇 Silence Remover</h2>
          <p class="text-gray-400 text-sm mt-1 uppercase tracking-widest">Detect and remove silent gaps from audio</p>
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
                <div class="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 text-xl">🔇</div>
                <div><h3 class="font-bold">{{ state.inputFile.name }}</h3><p class="text-xs text-gray-500 font-mono mt-1">{{ (state.inputFile.size/1024/1024) | number:'1.2-2' }} MB</p></div>
              </div>

              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col gap-8 flex-1">
                <!-- Threshold -->
                <div class="flex flex-col gap-2">
                  <div class="flex justify-between"><label class="text-sm font-bold text-gray-300">Silence Threshold</label><span class="text-amber-400 font-mono font-black text-sm">{{ thresholdDb() }} dBFS</span></div>
                  <input type="range" min="-60" max="-10" step="1" [value]="thresholdDb()" (input)="thresholdDb.set(+$any($event.target).value)"
                        class="w-full accent-amber-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer">
                  <div class="flex gap-2">
                    @for (v of [-60,-40,-30,-20]; track v) {
                      <button (click)="thresholdDb.set(v)" class="flex-1 py-1 text-[10px] font-bold rounded-lg border transition-colors"
                              [class]="thresholdDb() === v ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-gray-900 border-gray-700 text-gray-500'">{{ v }} dB</button>
                    }
                  </div>
                </div>

                <!-- Min Duration -->
                <div class="flex flex-col gap-2">
                  <div class="flex justify-between"><label class="text-sm font-bold text-gray-300">Minimum Silence Duration</label><span class="text-orange-400 font-mono font-black text-sm">{{ minSilenceDur() }}s</span></div>
                  <input type="range" min="0.1" max="5" step="0.1" [value]="minSilenceDur()" (input)="minSilenceDur.set(+$any($event.target).value)"
                        class="w-full accent-orange-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer">
                  <p class="text-xs text-gray-500">Gaps shorter than this will be kept as-is.</p>
                </div>

                <!-- Padding -->
                <div class="flex flex-col gap-2">
                  <div class="flex justify-between"><label class="text-sm font-bold text-gray-300">Padding</label><span class="text-yellow-400 font-mono font-black text-sm">{{ padding() }}s</span></div>
                  <input type="range" min="0" max="2" step="0.05" [value]="padding()" (input)="padding.set(+$any($event.target).value)"
                        class="w-full accent-yellow-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer">
                  <p class="text-xs text-gray-500">Extra silence to keep before/after speech (prevents harsh cuts).</p>
                </div>
              </div>
            </div>

            <div class="w-full lg:w-80 flex flex-col gap-6">
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col min-h-[300px]">
                <label class="text-xs text-gray-400 uppercase tracking-widest mb-3 font-bold">Format</label>
                <select [value]="outputFormat()" (change)="outputFormat.set($any($event.target).value)"
                        class="w-full bg-gray-900 border border-gray-700 font-bold text-sm rounded-lg px-4 py-3 outline-none focus:border-amber-500 transition-colors mb-6">
                  <option value="wav">WAV</option><option value="mp3">MP3</option><option value="aac">AAC</option>
                </select>

                @if (state.status === 'processing') {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6" [@fadeIn]>
                    <div class="relative w-24 h-24 mb-4">
                      <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100"><circle stroke-width="4" stroke="#1f2937" fill="transparent" r="46" cx="50" cy="50"/><circle class="text-amber-500" stroke-width="4" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50" stroke-dasharray="290" [style.stroke-dashoffset]="290-(290*state.progress)/100" stroke-linecap="round"/></svg>
                      <div class="absolute inset-0 flex items-center justify-center text-lg font-black">{{ state.progress }}%</div>
                    </div>
                    <div class="w-full max-h-20 overflow-y-auto font-mono text-[10px] text-gray-500 bg-black/80 rounded-xl p-2 border border-gray-800">
                      @for (l of state.logs; track $index) { <div><span class="text-amber-400/40">></span> {{ l }}</div> }
                    </div>
                  </div>
                }

                @if (state.status === 'done' && state.outputBlob) {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6 gap-3 text-center" [@slideUp]>
                    <div class="text-3xl">✅</div>
                    <p class="font-black text-lg">Silence Removed!</p>
                    @if (state.info) { <p class="text-xs text-gray-400 bg-gray-900 rounded-lg p-2 font-mono">{{ state.info }}</p> }
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
                        [class]="state.status === 'processing' ? 'bg-gray-800 text-amber-400' : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.2)]'">
                      @if (state.status === 'processing') { <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Removing... } @else { 🔇 Remove Silence }
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
export class SilenceRemoverComponent implements OnDestroy {
  private store = inject(Store);
  readonly state$ = this.store.select(selectSilenceRemoverState);
  outputFormat = signal<ExportFormat>('wav');
  thresholdDb = signal(-40);
  minSilenceDur = signal(0.5);
  padding = signal(0.1);
  private cachedBlobUrls = new Map<Blob, string>();

  onFileSelected(files: File[]) { if (files.length) this.store.dispatch(SilenceRemoverActions.loadFile({ file: files[0] })); }
  onProcess(state: any) {
    if (state.status === 'processing') return;
    this.store.dispatch(SilenceRemoverActions.startProcessing({ format: this.outputFormat(), thresholdDb: this.thresholdDb(), minSilenceDuration: this.minSilenceDur(), paddingDuration: this.padding() }));
  }
  getBlobUrl(blob: Blob): string {
    if (!this.cachedBlobUrls.has(blob)) this.cachedBlobUrls.set(blob, URL.createObjectURL(blob));
    return this.cachedBlobUrls.get(blob)!;
  }
  onDownload(state: any) {
    if (!state.outputBlob) return;
    const a = document.createElement('a'); a.href = this.getBlobUrl(state.outputBlob);
    a.download = `omni_desilenced_${state.inputFile?.name?.replace(/\.[^.]+$/, '')}.${this.outputFormat()}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }
  onReset() { this.cachedBlobUrls.forEach(url => URL.revokeObjectURL(url)); this.cachedBlobUrls.clear(); this.store.dispatch(SilenceRemoverActions.resetState()); }
  ngOnDestroy() { this.onReset(); }
}
