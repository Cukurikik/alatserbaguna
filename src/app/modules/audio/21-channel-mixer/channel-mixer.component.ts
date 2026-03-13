import { Component, ChangeDetectionStrategy, inject, OnDestroy, signal } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger } from '@angular/animations';
import { ChannelMixerActions, selectChannelMixerState } from './channel-mixer.store';
import { AudioDropZoneComponent } from '../shared/components/audio-drop-zone/audio-drop-zone.component';
import { ChannelOperation } from './channel-mixer.schema';
import { ExportFormat } from '../shared/types/audio.types';

@Component({
  selector: 'app-channel-mixer',
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
          <h2 class="text-4xl font-black bg-gradient-to-r from-cyan-400 to-teal-500 bg-clip-text text-transparent tracking-tight">🔀 Channel Mixer</h2>
          <p class="text-gray-400 text-sm mt-1 uppercase tracking-widest">Mono/Stereo routing, swap channels, and Mid-Side encoding</p>
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
                <div class="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-xl">🔀</div>
                <div><h3 class="font-bold">{{ state.inputFile.name }}</h3><p class="text-xs text-gray-500 font-mono mt-1">{{ (state.inputFile.size / 1024 / 1024) | number:'1.2-2' }} MB</p></div>
              </div>

              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex-1">
                <h3 class="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Operation</h3>
                <div class="grid grid-cols-2 gap-3">
                  @for (op of ops; track op.id) {
                    <button (click)="selectedOp.set(op.id)" class="p-4 rounded-xl border text-left transition-all"
                            [class]="selectedOp() === op.id ? 'bg-cyan-500/10 border-cyan-500/40' : 'bg-gray-900/50 border-gray-800 hover:border-gray-600'">
                      <div class="text-xl mb-1">{{ op.icon }}</div>
                      <p class="text-sm font-bold" [class]="selectedOp() === op.id ? 'text-cyan-400' : 'text-gray-300'">{{ op.label }}</p>
                      <p class="text-[10px] text-gray-500 mt-1">{{ op.desc }}</p>
                    </button>
                  }
                </div>

                @if (selectedOp() === 'toMono') {
                  <div class="mt-4 flex gap-2" [@fadeIn]>
                    @for (m of [['average','Average L+R'],['left','Left Only'],['right','Right Only']]; track m[0]) {
                      <button (click)="monoMode.set(m[0] as any)" class="flex-1 py-2 text-xs font-bold rounded-lg border transition-colors"
                              [class]="monoMode() === m[0] ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' : 'bg-gray-900 border-gray-700 text-gray-400'">{{ m[1] }}</button>
                    }
                  </div>
                }
              </div>
            </div>

            <div class="w-full lg:w-80 flex flex-col gap-6">
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col min-h-[300px]">
                <label class="text-xs text-gray-400 uppercase tracking-widest mb-3 font-bold">Format</label>
                <select [value]="outputFormat()" (change)="onFormatChange($event)" class="w-full bg-gray-900 border border-gray-700 font-bold text-sm rounded-lg px-4 py-3 outline-none focus:border-cyan-500 transition-colors mb-6">
                  <option value="wav">WAV</option><option value="mp3">MP3</option><option value="aac">AAC</option>
                </select>

                @if (state.status === 'processing') {
                  <div class="flex-1 flex items-center justify-center mb-6" [@fadeIn]>
                    <div class="relative w-24 h-24">
                      <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100"><circle stroke-width="4" stroke="#1f2937" fill="transparent" r="46" cx="50" cy="50"/><circle class="text-cyan-500" stroke-width="4" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50" stroke-dasharray="290" [style.stroke-dashoffset]="290-(290*state.progress)/100" stroke-linecap="round"/></svg>
                      <div class="absolute inset-0 flex items-center justify-center text-lg font-black">{{ state.progress }}%</div>
                    </div>
                  </div>
                }

                @if (state.status === 'done' && state.outputBlob) {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6 gap-3 text-center" [@slideUp]>
                    <div class="text-3xl">✅</div>
                    <p class="font-black text-lg text-white">Done!</p>
                    <audio [src]="getBlobUrl(state.outputBlob)" controls class="w-full outline-none mt-2"></audio>
                  </div>
                }

                @if (state.status === 'error') {
                  <div class="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm" [@fadeIn]>{{ state.errorMessage }}</div>
                }

                <div class="mt-auto">
                  @if (state.status === 'done') {
                    <button (click)="onDownload(state)" class="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl font-black text-sm uppercase active:scale-95 transition-all">⬇ Download</button>
                  } @else {
                    <button (click)="onProcess(state)" [disabled]="state.status === 'processing'"
                        class="w-full py-4 rounded-xl font-black text-sm uppercase transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        [class]="state.status === 'processing' ? 'bg-gray-800 text-cyan-400' : 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:opacity-90 active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.2)]'">
                      @if (state.status === 'processing') { <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Processing... } @else { 🔀 Apply Mix }
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
export class ChannelMixerComponent implements OnDestroy {
  private store = inject(Store);
  readonly state$ = this.store.select(selectChannelMixerState);
  outputFormat = signal<ExportFormat>('wav');
  selectedOp = signal<ChannelOperation>('toMono');
  monoMode = signal<'average' | 'left' | 'right'>('average');
  private cachedBlobUrls = new Map<Blob, string>();

  readonly ops = [
    { id: 'toMono' as ChannelOperation, icon: '🔊', label: 'Stereo → Mono', desc: 'Mixdown to single channel' },
    { id: 'toStereo' as ChannelOperation, icon: '🔉', label: 'Mono → Stereo', desc: 'Duplicate to both channels' },
    { id: 'swapLR' as ChannelOperation, icon: '↔️', label: 'Swap L/R', desc: 'Exchange left and right' },
    { id: 'extractL' as ChannelOperation, icon: '⬅️', label: 'Extract Left', desc: 'Left channel only as mono' },
    { id: 'extractR' as ChannelOperation, icon: '➡️', label: 'Extract Right', desc: 'Right channel only as mono' },
    { id: 'midSideEncode' as ChannelOperation, icon: '🔃', label: 'Mid/Side Encode', desc: 'M=(L+R)/2, S=(L-R)/2' },
  ];

  onFileSelected(files: File[]) { if (files.length) this.store.dispatch(ChannelMixerActions.loadFile({ file: files[0] })); }
  onFormatChange(e: Event) { this.outputFormat.set((e.target as any).value as ExportFormat); }
  onProcess(state: any) {
    if (state.status === 'processing') return;
    this.store.dispatch(ChannelMixerActions.startProcessing({ format: this.outputFormat(), operation: this.selectedOp(), monoMode: this.monoMode() }));
  }
  getBlobUrl(blob: Blob): string {
    if (!this.cachedBlobUrls.has(blob)) this.cachedBlobUrls.set(blob, URL.createObjectURL(blob));
    return this.cachedBlobUrls.get(blob)!;
  }
  onDownload(state: any) {
    if (!state.outputBlob) return;
    const a = document.createElement('a'); a.href = this.getBlobUrl(state.outputBlob);
    a.download = `omni_ch_${this.selectedOp()}_${state.inputFile?.name?.replace(/\.[^.]+$/, '')}.${this.outputFormat()}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }
  onReset() { this.cachedBlobUrls.forEach(url => URL.revokeObjectURL(url)); this.cachedBlobUrls.clear(); this.store.dispatch(ChannelMixerActions.resetState()); }
  ngOnDestroy() { this.onReset(); }
}
