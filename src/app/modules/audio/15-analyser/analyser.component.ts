import { Component, ChangeDetectionStrategy, inject, OnDestroy, OnInit, ElementRef, ViewChild, signal, computed, AfterViewInit } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger } from '@angular/animations';
import { AnalyserActions, selectAnalyserState } from './analyser.store';
import { AudioDropZoneComponent } from '../shared/components/audio-drop-zone/audio-drop-zone.component';
import { AnalysisResult } from './analyser.schema';

@Component({
  selector: 'app-analyser',
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
          <h2 class="text-4xl font-black bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent tracking-tight">
            📊 Waveform Analyser
          </h2>
          <p class="text-gray-400 text-sm mt-1 uppercase tracking-widest">Waveform · Spectrum · Loudness · Metadata</p>
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
          <div class="flex flex-col gap-6" [@fadeIn]>

            <!-- Action + Status Card -->
            <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-5 flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 text-xl shrink-0">🎵</div>
              <div class="flex-1 min-w-0">
                <h3 class="font-bold truncate">{{ state.inputFile.name }}</h3>
                <p class="text-xs text-gray-500 font-mono">{{ (state.inputFile.size / 1024 / 1024) | number:'1.2-2' }} MB</p>
              </div>
              @if (state.status === 'idle' || state.status === 'error') {
                <button (click)="onAnalyse()" class="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 hover:opacity-90 active:scale-95 rounded-xl font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(139,92,246,0.2)] transition-all whitespace-nowrap">
                  📊 Analyse
                </button>
              } @else if (state.status === 'processing') {
                <div class="flex items-center gap-3 text-violet-400 text-sm font-bold">
                  <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                  Analysing... {{ state.progress }}%
                </div>
              }
            </div>

            @if (state.status === 'error') {
              <div class="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm" [@fadeIn]>
                <span class="font-bold">Error:</span> {{ state.errorMessage }}
              </div>
            }

            @if (state.status === 'done' && state.result; as result) {
              <!-- Metadata Cards -->
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" [@slideUp]>
                @for (card of getMetaCards(result); track card.label) {
                  <div class="bg-[#12121a] border border-gray-800 rounded-xl p-4 text-center hover:border-violet-500/30 transition-colors">
                    <p class="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">{{ card.label }}</p>
                    <p class="text-lg font-black text-white font-mono">{{ card.value }}</p>
                    @if (card.unit) { <p class="text-[10px] text-gray-600 font-mono">{{ card.unit }}</p> }
                  </div>
                }
              </div>

              <!-- Waveform Canvas -->
              <div class="bg-[#12121a] border border-gray-800 rounded-2xl p-5" [@slideUp]>
                <h4 class="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Waveform</h4>
                <canvas #waveformCanvas class="w-full h-32 rounded-lg bg-black/60" [width]="canvasWidth" height="128"></canvas>
              </div>

              <!-- Spectrum Bar Chart -->
              <div class="bg-[#12121a] border border-gray-800 rounded-2xl p-5" [@slideUp]>
                <h4 class="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Frequency Spectrum</h4>
                <div class="flex items-end gap-px h-24 w-full">
                  @for (bin of result.spectrumBins; track $index) {
                    <div class="flex-1 rounded-sm transition-all"
                         [style.height.%]="bin * 100"
                         [style.background]="getSpectrumColor($index, result.spectrumBins.length)">
                    </div>
                  }
                </div>
                <div class="flex justify-between text-[9px] text-gray-600 font-mono mt-2">
                  <span>20 Hz</span><span>200 Hz</span><span>2 kHz</span><span>20 kHz</span>
                </div>
              </div>

              <!-- Loudness Cards -->
              <div class="grid grid-cols-3 gap-4" [@slideUp]>
                <div class="bg-[#12121a] border border-gray-800 rounded-xl p-5 text-center">
                  <p class="text-xs text-gray-500 uppercase font-bold tracking-widest mb-2">RMS Loudness</p>
                  <p class="text-3xl font-black font-mono" [class]="result.rmsDb > -12 ? 'text-red-400' : result.rmsDb > -24 ? 'text-amber-400' : 'text-emerald-400'">
                    {{ result.rmsDb | number:'1.1-1' }}
                  </p>
                  <p class="text-xs text-gray-600 font-mono">dBFS</p>
                </div>
                <div class="bg-[#12121a] border border-gray-800 rounded-xl p-5 text-center">
                  <p class="text-xs text-gray-500 uppercase font-bold tracking-widest mb-2">True Peak</p>
                  <p class="text-3xl font-black font-mono" [class]="result.peakDb > -1 ? 'text-red-400' : result.peakDb > -6 ? 'text-amber-400' : 'text-emerald-400'">
                    {{ result.peakDb | number:'1.1-1' }}
                  </p>
                  <p class="text-xs text-gray-600 font-mono">dBFS</p>
                </div>
                <div class="bg-[#12121a] border border-gray-800 rounded-xl p-5 text-center">
                  <p class="text-xs text-gray-500 uppercase font-bold tracking-widest mb-2">Dynamic Range</p>
                  <p class="text-3xl font-black font-mono text-violet-400">{{ result.dynamicRange | number:'1.1-1' }}</p>
                  <p class="text-xs text-gray-600 font-mono">dB</p>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`:host { display: block; height: 100%; }`]
})
export class AnalyserComponent implements OnDestroy, AfterViewInit {
  @ViewChild('waveformCanvas') waveformCanvas?: ElementRef<HTMLCanvasElement>;

  private store = inject(Store);
  readonly state$ = this.store.select(selectAnalyserState);
  canvasWidth = 1200;
  private lastResult: AnalysisResult | null = null;

  ngAfterViewInit() {
    // Draw after view init if result already loaded
    if (this.lastResult) this.drawWaveform(this.lastResult);
  }

  onFileSelected(files: File[]) {
    if (files.length) this.store.dispatch(AnalyserActions.loadFile({ file: files[0] }));
  }

  onAnalyse() {
    this.store.dispatch(AnalyserActions.startAnalysis());
    // Subscribe to draw waveform once result arrives
    this.state$.subscribe(state => {
      if (state.result && state.result !== this.lastResult) {
        this.lastResult = state.result;
        setTimeout(() => this.drawWaveform(state.result!), 50);
      }
    });
  }

  drawWaveform(result: AnalysisResult) {
    const canvas = this.waveformCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const peaks = result.peaks;
    const barWidth = w / peaks.length;
    const mid = h / 2;

    for (let i = 0; i < peaks.length; i++) {
      const x = i * barWidth;
      const peak = peaks[i];
      const topY = mid + peak.max * mid;
      const botY = mid + peak.min * mid;

      const grad = ctx.createLinearGradient(0, botY, 0, topY);
      grad.addColorStop(0, 'rgba(139,92,246,0.4)');
      grad.addColorStop(0.5, 'rgba(168,85,247,0.9)');
      grad.addColorStop(1, 'rgba(139,92,246,0.4)');

      ctx.fillStyle = grad;
      ctx.fillRect(x, topY, Math.max(0.5, barWidth - 0.5), Math.max(1, botY - topY));
    }

    // Center line
    ctx.strokeStyle = 'rgba(139,92,246,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(w, mid);
    ctx.stroke();
  }

  getMetaCards(r: AnalysisResult): { label: string; value: string; unit?: string }[] {
    const dur = r.duration;
    const mins = Math.floor(dur / 60);
    const secs = (dur % 60).toFixed(1);
    return [
      { label: 'Duration', value: `${mins}:${secs.padStart(4, '0')}` },
      { label: 'Sample Rate', value: `${r.sampleRate / 1000}`, unit: 'kHz' },
      { label: 'Channels', value: r.channels === 1 ? 'Mono' : r.channels === 2 ? 'Stereo' : `${r.channels}ch` },
      { label: 'File Size', value: r.fileSizeMB.toFixed(2), unit: 'MB' },
      { label: 'Dynamic Range', value: r.dynamicRange.toFixed(1), unit: 'dB' },
      { label: 'Peak', value: r.peakDb.toFixed(1), unit: 'dBFS' },
    ];
  }

  getSpectrumColor(index: number, total: number): string {
    const hue = 240 + (index / total) * 120; // violet → green
    return `hsl(${hue}, 70%, 55%)`;
  }

  onReset() {
    this.lastResult = null;
    this.store.dispatch(AnalyserActions.resetState());
  }

  ngOnDestroy() { this.onReset(); }
}
