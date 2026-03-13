import { Component, ChangeDetectionStrategy, inject, OnDestroy, signal } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger } from '@angular/animations';
import { FadeActions, selectFadeState } from './fade.store';
import { AudioDropZoneComponent } from '../shared/components/audio-drop-zone/audio-drop-zone.component';
import { ExportFormat } from '../shared/types/audio.types';
import { FadeCurve } from './fade.schema';

@Component({
  selector: 'app-fade',
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
          <h2 class="text-4xl font-black bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent tracking-tight">🌅 Fade In / Out</h2>
          <p class="text-gray-400 text-sm mt-1 uppercase tracking-widest">Apply smooth fade envelopes to audio files</p>
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
              <!-- File -->
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-5 flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 text-xl">🌅</div>
                <div>
                  <h3 class="font-bold">{{ state.inputFile.name }}</h3>
                  <p class="text-xs text-gray-500 mt-1 font-mono">{{ (state.inputFile.size / 1024 / 1024) | number:'1.2-2' }} MB</p>
                </div>
              </div>

              <!-- Controls -->
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col gap-6 flex-1">
                <!-- Curve Selector -->
                <div>
                  <label class="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Envelope Curve</label>
                  <div class="grid grid-cols-3 gap-3">
                    @for (c of curves; track c.id) {
                      <button (click)="curve.set(c.id)" class="p-3 rounded-xl border transition-all flex flex-col items-center gap-2"
                              [class]="curve() === c.id ? 'bg-sky-500/10 border-sky-500/40' : 'bg-gray-900 border-gray-800 hover:border-gray-600'">
                        <!-- SVG Preview -->
                        <svg viewBox="0 0 60 30" class="w-full h-8">
                          <polyline [attr.points]="c.svgPoints" fill="none" stroke-width="2" stroke-linecap="round"
                                    [attr.stroke]="curve() === c.id ? '#38bdf8' : '#374151'"></polyline>
                        </svg>
                        <span class="text-[10px] font-bold" [class]="curve() === c.id ? 'text-sky-400' : 'text-gray-500'">{{ c.label }}</span>
                      </button>
                    }
                  </div>
                </div>

                <!-- Fade In Duration -->
                <div class="flex flex-col gap-2">
                  <div class="flex justify-between">
                    <label class="text-sm font-bold text-gray-300">Fade In Duration</label>
                    <span class="text-sm text-sky-400 font-mono font-black">{{ fadeInDuration() }}s</span>
                  </div>
                  <input type="range" min="0" max="30" step="0.5" [value]="fadeInDuration()" (input)="onFadeInChange($event)"
                       class="w-full accent-sky-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer">
                  <div class="flex gap-2">
                    @for (p of [0, 1, 2, 5]; track p) {
                      <button (click)="fadeInDuration.set(p)" class="flex-1 py-1 text-[10px] font-bold rounded-lg border transition-colors"
                              [class]="fadeInDuration() === p ? 'bg-sky-500/10 border-sky-500/40 text-sky-400' : 'bg-gray-900 border-gray-700 text-gray-500'">{{ p }}s</button>
                    }
                  </div>
                </div>

                <!-- Fade Out Duration -->
                <div class="flex flex-col gap-2">
                  <div class="flex justify-between">
                    <label class="text-sm font-bold text-gray-300">Fade Out Duration</label>
                    <span class="text-sm text-blue-400 font-mono font-black">{{ fadeOutDuration() }}s</span>
                  </div>
                  <input type="range" min="0" max="30" step="0.5" [value]="fadeOutDuration()" (input)="onFadeOutChange($event)"
                       class="w-full accent-blue-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer">
                  <div class="flex gap-2">
                    @for (p of [0, 1, 2, 5]; track p) {
                      <button (click)="fadeOutDuration.set(p)" class="flex-1 py-1 text-[10px] font-bold rounded-lg border transition-colors"
                              [class]="fadeOutDuration() === p ? 'bg-blue-500/10 border-blue-500/40 text-blue-400' : 'bg-gray-900 border-gray-700 text-gray-500'">{{ p }}s</button>
                    }
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Panel -->
            <div class="w-full lg:w-96 flex flex-col gap-6">
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col min-h-[400px]">
                <label class="text-xs text-gray-400 uppercase tracking-widest mb-3 font-bold">Output Format</label>
                <select [value]="outputFormat()" (change)="onFormatChange($event)" class="w-full bg-gray-900 border border-gray-700 font-bold text-sm rounded-lg px-4 py-3 outline-none focus:border-sky-500 transition-colors mb-6">
                  <option value="wav">WAV (Lossless)</option>
                  <option value="mp3">MP3</option>
                  <option value="aac">AAC</option>
                </select>

                @if (state.status === 'processing') {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6" [@fadeIn]>
                    <div class="relative w-28 h-28 mb-4">
                      <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle stroke-width="4" stroke="#1f2937" fill="transparent" r="46" cx="50" cy="50" />
                        <circle class="text-sky-500 transition-all" stroke-width="4" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50"
                                stroke-dasharray="290" [style.stroke-dashoffset]="290 - (290 * state.progress) / 100" stroke-linecap="round" />
                      </svg>
                      <div class="absolute inset-0 flex items-center justify-center text-xl font-black">{{ state.progress }}%</div>
                    </div>
                    <div class="w-full h-20 bg-black/80 rounded-xl border border-gray-800 p-2 overflow-y-auto font-mono text-[10px] text-gray-500">
                      @for (log of state.logs; track $index) { <div><span class="text-sky-400/40">></span> {{ log }}</div> }
                    </div>
                  </div>
                }

                @if (state.status === 'done' && state.outputBlob) {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6 gap-3" [@slideUp]>
                    <div class="text-3xl">✅</div>
                    <p class="font-black text-lg">Fades Applied!</p>
                    <p class="text-sm text-gray-400 font-mono">{{ state.outputSizeMB | number:'1.2-2' }} MB</p>
                    <audio [src]="getBlobUrl(state.outputBlob)" controls class="w-full outline-none mt-2"></audio>
                  </div>
                }

                @if (state.status === 'error') {
                  <div class="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm" [@fadeIn]>
                    {{ state.errorMessage }}
                  </div>
                }

                <div class="mt-auto">
                  @if (state.status === 'done') {
                    <button (click)="onDownload(state)" class="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all">⬇ Download</button>
                  } @else {
                    <button (click)="onProcess(state)" [disabled]="state.status === 'processing'"
                        class="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        [class]="state.status === 'processing' ? 'bg-gray-800 text-sky-400' : 'bg-gradient-to-r from-sky-500 to-blue-500 hover:opacity-90 active:scale-95 shadow-[0_0_20px_rgba(56,189,248,0.2)]'">
                      @if (state.status === 'processing') {
                        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                        Applying Fades...
                      } @else { 🌅 Apply Fades }
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
export class FadeComponent implements OnDestroy {
  private store = inject(Store);
  readonly state$ = this.store.select(selectFadeState);
  outputFormat = signal<ExportFormat>('wav');
  curve = signal<FadeCurve>('sCurve');
  fadeInDuration = signal<number>(2);
  fadeOutDuration = signal<number>(2);
  private cachedBlobUrls = new Map<Blob, string>();

  readonly curves = [
    { id: 'linear' as FadeCurve, label: 'Linear', svgPoints: '0,28 60,2' },
    { id: 'logarithmic' as FadeCurve, label: 'Logarithmic', svgPoints: '0,28 5,14 15,8 30,4 60,2' },
    { id: 'sCurve' as FadeCurve, label: 'S-Curve', svgPoints: '0,28 10,26 25,15 45,4 60,2' },
  ];

  onFileSelected(files: File[]) { if (files.length) this.store.dispatch(FadeActions.loadFile({ file: files[0] })); }
  onFadeInChange(e: Event) { this.fadeInDuration.set(parseFloat((e.target as HTMLInputElement).value)); }
  onFadeOutChange(e: Event) { this.fadeOutDuration.set(parseFloat((e.target as HTMLInputElement).value)); }
  onFormatChange(e: Event) { this.outputFormat.set((e.target as HTMLSelectElement).value as ExportFormat); }

  onProcess(state: any) {
    if (state.status === 'processing') return;
    this.store.dispatch(FadeActions.startProcessing({ format: this.outputFormat(), fadeInDuration: this.fadeInDuration(), fadeOutDuration: this.fadeOutDuration(), curve: this.curve() }));
  }

  onDownload(state: any) {
    if (!state.outputBlob) return;
    const a = document.createElement('a');
    a.href = this.getBlobUrl(state.outputBlob);
    a.download = `omni_fade_${state.inputFile?.name?.replace(/\.[^.]+$/, '')}.${this.outputFormat()}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  getBlobUrl(blob: Blob): string {
    if (this.cachedBlobUrls.has(blob)) return this.cachedBlobUrls.get(blob)!;
    const url = URL.createObjectURL(blob); this.cachedBlobUrls.set(blob, url); return url;
  }

  onReset() { this.cachedBlobUrls.forEach(url => URL.revokeObjectURL(url)); this.cachedBlobUrls.clear(); this.store.dispatch(FadeActions.resetState()); }
  ngOnDestroy() { this.onReset(); }
}
