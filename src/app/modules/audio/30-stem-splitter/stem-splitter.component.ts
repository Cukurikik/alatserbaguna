import { Component, ChangeDetectionStrategy, inject, OnDestroy, signal } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger } from '@angular/animations';
import { StemSplitterActions, selectStemSplitterState } from './stem-splitter.store';
import { AudioDropZoneComponent } from '../shared/components/audio-drop-zone/audio-drop-zone.component';
import { ExportFormat } from '../shared/types/audio.types';
import { StemLabel } from './stem-splitter.schema';

@Component({
  selector: 'app-stem-splitter',
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
          <h2 class="text-4xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent tracking-tight">🧬 AI Stem Splitter</h2>
          <p class="text-gray-400 text-sm mt-1 uppercase tracking-widest">Separate Vocals · Drums · Bass · Other Instruments</p>
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
          <div class="flex-1 flex flex-col gap-6" [@fadeIn]>
            <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-5 flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400 text-xl">🧬</div>
              <div class="flex-1"><h3 class="font-bold">{{ state.inputFile.name }}</h3><p class="text-xs text-gray-500 font-mono mt-1">{{ (state.inputFile.size/1024/1024) | number:'1.2-2' }} MB</p></div>
              <select [value]="outputFormat()" (change)="outputFormat.set($any($event.target).value)"
                      class="bg-gray-900 border border-gray-700 font-bold text-sm rounded-lg px-3 py-2 outline-none focus:border-yellow-500 transition-colors">
                <option value="wav">WAV</option><option value="mp3">MP3</option><option value="aac">AAC</option>
              </select>
            </div>

            <!-- Stem selector -->
            <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6">
              <label class="block text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Select Stems to Extract</label>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                @for (stem of stemOptions; track stem.id) {
                  <button (click)="toggleStem(stem.id)" class="p-4 rounded-xl border flex flex-col items-center gap-2 transition-all"
                          [class]="isSelected(stem.id) ? 'bg-yellow-500/15 border-yellow-500/50' : 'bg-gray-900 border-gray-800 hover:border-gray-600'">
                    <span class="text-2xl">{{ stem.icon }}</span>
                    <span class="text-xs font-black uppercase tracking-wide" [class]="isSelected(stem.id) ? 'text-yellow-400' : 'text-gray-500'">{{ stem.label }}</span>
                    <span class="text-[9px] text-gray-600">{{ stem.desc }}</span>
                  </button>
                }
              </div>
            </div>

            <!-- Processing Progress -->
            @if (state.status === 'processing') {
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col items-center gap-4" [@fadeIn]>
                <div class="relative w-24 h-24">
                  <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100"><circle stroke-width="4" stroke="#1f2937" fill="transparent" r="46" cx="50" cy="50"/><circle class="text-yellow-500" stroke-width="4" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50" stroke-dasharray="290" [style.stroke-dashoffset]="290-(290*state.progress)/100" stroke-linecap="round"/></svg>
                  <div class="absolute inset-0 flex items-center justify-center text-lg font-black">{{ state.progress }}%</div>
                </div>
                <div class="w-full max-h-20 overflow-y-auto font-mono text-[10px] text-gray-500 bg-black/80 rounded-xl p-2 border border-gray-800">
                  @for (l of state.logs; track $index) { <div><span class="text-yellow-400/40">></span> {{ l }}</div> }
                </div>
              </div>
            }

            <!-- Stem Results -->
            @if (state.status === 'done' && state.stems.length > 0) {
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6" [@slideUp]>
                <h3 class="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">✅ {{ state.stems.length }} Stems Ready</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  @for (stem of state.stems; track stem.label) {
                    <div class="bg-gray-900 rounded-xl p-4 border border-gray-800">
                      <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-2">
                          <span class="text-xl">{{ getStemIcon(stem.label) }}</span>
                          <div>
                            <p class="font-black text-sm capitalize">{{ stem.label }}</p>
                            <p class="text-[10px] text-gray-500 font-mono">{{ stem.sizeMB | number:'1.2-2' }} MB</p>
                          </div>
                        </div>
                        <button (click)="downloadStem(stem)" class="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-lg text-xs font-bold transition-all active:scale-95">⬇ DL</button>
                      </div>
                      @if (stem.blob) {
                        <audio [src]="getBlobUrl(stem.blob)" controls class="w-full h-8 outline-none" style="height:32px"></audio>
                      }
                    </div>
                  }
                </div>

                <button (click)="downloadAllZip(state.stems)" class="w-full mt-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-black text-sm uppercase active:scale-95 transition-all hover:opacity-90">
                  📦 Download All Stems
                </button>
              </div>
            }

            @if (state.status === 'error') { <div class="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">{{ state.errorMessage }}</div> }

            @if (state.status !== 'processing' && state.status !== 'done') {
              <button (click)="onProcess(state)" [disabled]="selectedStems().length === 0"
                  class="w-full py-4 rounded-xl font-black text-sm uppercase transition-all disabled:opacity-40 flex items-center justify-center gap-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 active:scale-95 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                🧬 Split {{ selectedStems().length }} Stem{{ selectedStems().length !== 1 ? 's' : '' }}
              </button>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`:host { display: block; height: 100%; }`]
})
export class StemSplitterComponent implements OnDestroy {
  private store = inject(Store);
  readonly state$ = this.store.select(selectStemSplitterState);
  outputFormat = signal<ExportFormat>('wav');
  selectedStems = signal<StemLabel[]>(['vocals', 'drums', 'bass', 'other']);
  private cachedBlobUrls = new Map<Blob, string>();

  readonly stemOptions = [
    { id: 'vocals' as StemLabel, icon: '🎤', label: 'Vocals', desc: 'Center channel' },
    { id: 'drums' as StemLabel, icon: '🥁', label: 'Drums', desc: 'Transient gate' },
    { id: 'bass' as StemLabel, icon: '🎸', label: 'Bass', desc: '< 250 Hz mono' },
    { id: 'other' as StemLabel, icon: '🎹', label: 'Other', desc: 'Side channel' },
  ];

  isSelected(id: StemLabel): boolean { return this.selectedStems().includes(id); }
  toggleStem(id: StemLabel) {
    const curr = this.selectedStems();
    this.selectedStems.set(curr.includes(id) ? curr.filter(s => s !== id) : [...curr, id]);
  }
  getStemIcon(label: StemLabel): string {
    return this.stemOptions.find(o => o.id === label)?.icon ?? '🎵';
  }

  onFileSelected(files: File[]) { if (files.length) this.store.dispatch(StemSplitterActions.loadFile({ file: files[0] })); }
  onProcess(state: any) {
    if (state.status === 'processing' || this.selectedStems().length === 0) return;
    this.store.dispatch(StemSplitterActions.startProcessing({ format: this.outputFormat(), selectedStems: this.selectedStems() }));
  }
  getBlobUrl(blob: Blob): string {
    if (!this.cachedBlobUrls.has(blob)) this.cachedBlobUrls.set(blob, URL.createObjectURL(blob));
    return this.cachedBlobUrls.get(blob)!;
  }
  downloadStem(stem: { label: string, blob: Blob | null }) {
    if (!stem.blob) return;
    const a = document.createElement('a'); a.href = this.getBlobUrl(stem.blob);
    a.download = `omni_stem_${stem.label}.${this.outputFormat()}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }
  async downloadAllZip(stems: any[]) {
    // Trigger all downloads sequentially with delay
    for (const s of stems) {
      if (s.blob) {
        this.downloadStem(s);
        await new Promise(r => setTimeout(r, 300));
      }
    }
  }
  onReset() { this.cachedBlobUrls.forEach(url => URL.revokeObjectURL(url)); this.cachedBlobUrls.clear(); this.store.dispatch(StemSplitterActions.resetState()); }
  ngOnDestroy() { this.onReset(); }
}
