import { Component, ChangeDetectionStrategy, inject, OnDestroy, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger } from '@angular/animations';
import { VisualizerActions, selectVisualizerState } from './visualizer.store';
import { AudioDropZoneComponent } from '../shared/components/audio-drop-zone/audio-drop-zone.component';
import { VisualizerStyle, VisualizerColor } from './visualizer.schema';

@Component({
  selector: 'app-visualizer',
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
          <h2 class="text-4xl font-black bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent tracking-tight">🌊 Spectrum Visualizer</h2>
          <p class="text-gray-400 text-sm mt-1 uppercase tracking-widest">Generate MP4 video with animated audio spectrum</p>
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
              <!-- Style Selector -->
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6">
                <label class="block text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Visualization Style</label>
                <div class="grid grid-cols-3 gap-3">
                  @for (s of styles; track s.id) {
                    <button (click)="style.set(s.id)" class="p-4 rounded-xl border flex flex-col items-center gap-2 transition-all"
                            [class]="style() === s.id ? 'bg-emerald-500/15 border-emerald-500/50' : 'bg-gray-900 border-gray-800 hover:border-gray-600'">
                      <span class="text-2xl">{{ s.icon }}</span>
                      <span class="text-[11px] font-bold" [class]="style() === s.id ? 'text-emerald-400' : 'text-gray-400'">{{ s.label }}</span>
                    </button>
                  }
                </div>
              </div>

              <!-- Color Theme -->
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6">
                <label class="block text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Color Theme</label>
                <div class="grid grid-cols-4 gap-2">
                  @for (c of colorOptions; track c.id) {
                    <button (click)="colorTheme.set(c.id)" class="py-3 rounded-xl border flex flex-col items-center gap-1 transition-all"
                            [class]="colorTheme() === c.id ? 'border-emerald-500/50 bg-emerald-500/10' : 'bg-gray-900 border-gray-700 hover:border-gray-500'">
                      <div class="flex gap-0.5">@for (col of c.preview; track col) { <div class="w-3 h-3 rounded-full" [style.background]="col"></div> }</div>
                      <span class="text-[10px] font-bold" [class]="colorTheme() === c.id ? 'text-emerald-400' : 'text-gray-500'">{{ c.label }}</span>
                    </button>
                  }
                </div>
              </div>

              <!-- Resolution + FPS -->
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex gap-6">
                <div class="flex-1 flex flex-col gap-2">
                  <label class="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Resolution</label>
                  <div class="flex gap-2">
                    @for (r of resolutions; track r) {
                      <button (click)="setResolution(r)" class="flex-1 py-2 text-xs font-bold rounded-lg border transition-colors" [class]="resolution() === r ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-gray-900 border-gray-700 text-gray-400'">{{ r }}</button>
                    }
                  </div>
                </div>
                <div class="flex-1 flex flex-col gap-2">
                  <label class="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">FPS</label>
                  <div class="flex gap-2">
                    @for (f of fpsOptions; track f) {
                      <button (click)="setFps(f)" class="flex-1 py-2 text-xs font-bold rounded-lg border transition-colors" [class]="fps() === f ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-gray-900 border-gray-700 text-gray-400'">{{ f }}</button>
                    }
                  </div>
                </div>
              </div>
            </div>

            <div class="w-full lg:w-80 flex flex-col gap-6">
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col min-h-[300px]">
                @if (state.status === 'processing') {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6" [@fadeIn]>
                    <div class="relative w-24 h-24 mb-4">
                      <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100"><circle stroke-width="4" stroke="#1f2937" fill="transparent" r="46" cx="50" cy="50"/><circle class="text-emerald-500" stroke-width="4" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50" stroke-dasharray="290" [style.stroke-dashoffset]="290-(290*state.progress)/100" stroke-linecap="round"/></svg>
                      <div class="absolute inset-0 flex items-center justify-center text-lg font-black">{{ state.progress }}%</div>
                    </div>
                    <div class="w-full max-h-32 overflow-y-auto font-mono text-[10px] text-gray-500 bg-black/80 rounded-xl p-2 border border-gray-800">
                      @for (l of state.logs; track $index) { <div><span class="text-emerald-400/40">></span> {{ l }}</div> }
                    </div>
                  </div>
                }

                @if (state.status === 'done' && state.outputBlob) {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6 gap-3 text-center" [@slideUp]>
                    <div class="text-3xl">🎬</div>
                    <p class="font-black text-lg">Video Ready!</p>
                    <p class="text-sm text-gray-400 font-mono">{{ state.outputSizeMB | number:'1.2-2' }} MB · MP4</p>
                    <video [src]="getBlobUrl(state.outputBlob)" controls class="w-full rounded-lg mt-2" style="max-height:160px"></video>
                  </div>
                }

                @if (state.status === 'error') { <div class="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">{{ state.errorMessage }}</div> }

                <div class="mt-auto">
                  @if (state.status === 'done') {
                    <button (click)="onDownload(state)" class="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl font-black text-sm uppercase active:scale-95 transition-all">⬇ Download MP4</button>
                  } @else {
                    <button (click)="onProcess(state)" [disabled]="state.status === 'processing'"
                        class="w-full py-4 rounded-xl font-black text-sm uppercase transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        [class]="state.status === 'processing' ? 'bg-gray-800 text-emerald-400' : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.2)]'">
                      @if (state.status === 'processing') { <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Rendering... } @else { 🌊 Generate Video }
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
export class VisualizerComponent implements OnDestroy {
  private store = inject(Store);
  readonly state$ = this.store.select(selectVisualizerState);
  style = signal<VisualizerStyle>('bars');
  colorTheme = signal<VisualizerColor>('cyan');
  resolution = signal<'720p' | '1080p'>('720p');
  fps = signal<24 | 30 | 60>(30);
  private cachedBlobUrls = new Map<Blob, string>();

  readonly styles = [
    { id: 'bars' as VisualizerStyle, icon: '📊', label: 'Bars' },
    { id: 'waveform' as VisualizerStyle, icon: '〰️', label: 'Waveform' },
    { id: 'circle' as VisualizerStyle, icon: '⭕', label: 'Circle' },
  ];
  readonly colorOptions = [
    { id: 'cyan' as VisualizerColor, label: 'Neon', preview: ['#06b6d4', '#0891b2'] },
    { id: 'purple' as VisualizerColor, label: 'Violet', preview: ['#a855f7', '#7c3aed'] },
    { id: 'rainbow' as VisualizerColor, label: 'Rainbow', preview: ['#ef4444', '#22c55e', '#06b6d4'] },
    { id: 'green' as VisualizerColor, label: 'Matrix', preview: ['#22c55e', '#16a34a'] },
  ];

  readonly resolutions: ('720p' | '1080p')[] = ['720p', '1080p'];
  readonly fpsOptions: (24 | 30 | 60)[] = [24, 30, 60];

  onFileSelected(files: File[]) { if (files.length) this.store.dispatch(VisualizerActions.loadFile({ file: files[0] })); }
  onProcess(state: any) {
    if (state.status === 'processing' || !state.inputFile) return;
    this.store.dispatch(VisualizerActions.startProcessing({
      config: { file: state.inputFile, style: this.style(), colorTheme: this.colorTheme(), backgroundColor: '#000000', resolution: this.resolution(), fps: this.fps() }
    }));
  }
  setResolution(r: '720p' | '1080p') { this.resolution.set(r); }
  setFps(f: 24 | 30 | 60) { this.fps.set(f); }
  getBlobUrl(blob: Blob): string {
    if (!this.cachedBlobUrls.has(blob)) this.cachedBlobUrls.set(blob, URL.createObjectURL(blob));
    return this.cachedBlobUrls.get(blob)!;
  }
  onDownload(state: any) {
    if (!state.outputBlob) return;
    const a = document.createElement('a'); a.href = this.getBlobUrl(state.outputBlob);
    a.download = `omni_visualizer_${state.inputFile?.name?.replace(/\.[^.]+$/, '')}.mp4`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }
  onReset() { this.cachedBlobUrls.forEach(url => URL.revokeObjectURL(url)); this.cachedBlobUrls.clear(); this.store.dispatch(VisualizerActions.resetState()); }
  ngOnDestroy() { this.onReset(); }
}
