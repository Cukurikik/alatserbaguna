import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger } from '@angular/animations';
import { PitchShifterActions, selectPitchShifterState } from './pitch-shifter.store';
import { AudioDropZoneComponent } from '../shared/components/audio-drop-zone/audio-drop-zone.component';
import { AudioProgressRingComponent } from '../shared/components/audio-progress-ring/audio-progress-ring.component';
import { AudioPlayerComponent } from '../shared/components/audio-player/audio-player.component';

@Component({
  selector: 'app-pitch-shifter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, DecimalPipe, AudioDropZoneComponent, AudioProgressRingComponent, AudioPlayerComponent],
  animations: [
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0 }), animate('400ms ease-out', style({ opacity: 1 }))])]),
    trigger('slideUp', [transition(':enter', [style({ opacity: 0, transform: 'translateY(20px)' }), animate('500ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0)' }))])]),
  ],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto" [@fadeIn]>
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-pink-400 via-pink-500 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            🎵 Pitch Shifter
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Shift pitch by semitones without changing speed using Phase Vocoder.</p>
        </div>
        @if ((state$ | async)?.inputFile) {
          <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-red-400 transition-all uppercase tracking-tighter">
            <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-red-950/30 transition-colors">✕</span>Reset
          </button>
        }
      </div>
      @if (state$ | async; as state) {
        @if (!state.inputFile) {
          <div class="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full py-12" [@slideUp]>
            <app-audio-drop-zone (filesSelected)="onFileSelected($event)"></app-audio-drop-zone>
          </div>
        } @else {
          <div class="flex-1 flex flex-col lg:flex-row gap-8 min-h-0" [@fadeIn]>
            <div class="flex-1 flex flex-col gap-6 min-h-0">
              <div class="bg-gray-900/40 backdrop-blur-md rounded-2xl p-6 border border-gray-800">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 text-2xl">🎵</div>
                  <div class="flex-1 min-w-0">
                    <p class="text-white font-black text-sm truncate">{{ state.inputFile.name }}</p>
                    <p class="text-gray-500 text-xs mt-1">{{ (state.inputFile.size / 1024 / 1024) | number:'1.2-2' }} MB</p>
                  </div>
                  <div class="px-3 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20">
                    <span class="text-xs font-bold text-pink-400 uppercase">{{ state.status }}</span>
                  </div>
                </div>
              </div>
              
              <div class="bg-gray-900/40 backdrop-blur-md rounded-2xl p-6 border border-gray-800">
                <h3 class="text-sm font-black text-white uppercase tracking-wider mb-4">⚙️ Output Format</h3>
                <div class="flex flex-wrap gap-2 mb-6">
                  @for (fmt of formats; track fmt) {
                    <button (click)="selectedFormat = fmt"
                      class="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all"
                      [class]="selectedFormat === fmt ? 'bg-pink-500/20 border-pink-500/50 text-pink-400' : 'bg-gray-800/50 border-gray-700 text-gray-500 hover:border-gray-600'">
                      {{ fmt.toUpperCase() }}
                    </button>
                  }
                </div>
                <button (click)="onProcess(state)" [disabled]="state.status === 'processing' || state.status === 'loading'"
                  class="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                  [class]="(state.status === 'processing' || state.status === 'loading') ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-pink-600 to-pink-500 hover:opacity-90 text-white shadow-lg shadow-pink-500/20 active:scale-95'">
                  @if (state.status === 'processing') {
                    <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    Processing...
                  } @else { ⚡ Process Audio }
                </button>
              </div>
              @if (state.status === 'processing') {
                <div class="bg-gray-900/40 rounded-2xl p-6 border border-gray-800 flex flex-col items-center gap-4" [@fadeIn]>
                  <app-audio-progress-ring [progress]="state.progress" [color]="'pink'"></app-audio-progress-ring>
                  <span class="text-pink-400 font-mono text-xs uppercase tracking-widest animate-pulse">Processing... {{ state.progress }}%</span>
                </div>
              }
              @if (state.status === 'error' && state.errorMessage) {
                <div class="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4" [@fadeIn]>
                  <span class="text-rose-400 text-lg shrink-0">⚠</span>
                  <div class="flex-1">
                    <p class="text-white font-black text-xs uppercase">Processing Error</p>
                    <p class="text-rose-400 text-xs mt-1 leading-relaxed">{{ state.errorMessage }}</p>
                    @if (state.retryable) {
                      <button (click)="onProcess(state)" class="mt-2 text-xs font-black text-red-400 hover:text-white underline underline-offset-4">Retry</button>
                    }
                  </div>
                </div>
              }
            </div>
            <div class="w-full lg:w-80 flex flex-col gap-6">
              @if (state.status === 'done' && state.outputBlob) {
                <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex flex-col gap-4" [@slideUp]>
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">✅</div>
                    <div>
                      <p class="text-white font-black text-sm">Complete!</p>
                      <p class="text-emerald-400 text-xs">{{ state.outputSizeMB | number:'1.2-2' }} MB</p>
                    </div>
                  </div>
                  <app-audio-player [audioBlob]="state.outputBlob"></app-audio-player>
                  <button (click)="onDownload(state)" class="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3">
                    ⬇ Download Result
                  </button>
                </div>
              }
              <div class="bg-gray-900/20 rounded-2xl p-6 border border-white/5 border-dashed">
                <h4 class="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">ℹ About This Tool</h4>
                <p class="text-xs text-gray-600 leading-relaxed">Shift pitch by semitones without changing speed using Phase Vocoder.</p>
                <div class="mt-4 space-y-2">
                  <div class="flex justify-between"><span class="text-xs text-gray-600">Engine</span><span class="text-xs text-pink-400 font-bold">FFmpeg WASM</span></div>
                  <div class="flex justify-between"><span class="text-xs text-gray-600">Client-Side</span><span class="text-xs text-emerald-400 font-bold">100%</span></div>
                </div>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
  `]
})
export class PitchShifterComponent implements OnDestroy {
  private store = inject(Store);
  readonly state$ = this.store.select(selectPitchShifterState);
  formats = ['wav', 'mp3', 'aac', 'ogg', 'flac', 'opus', 'm4a'];
  selectedFormat = 'mp3';
  private blobUrl: string | null = null;

  onFileSelected(files: File[]): void {
    if (files.length > 0) this.store.dispatch(PitchShifterActions.loadFile({ file: files[0] }));
  }
  onProcess(state: any): void {
    if (!state.inputFile || state.status === 'processing' || state.status === 'loading') return;
    this.store.dispatch(PitchShifterActions.startProcessing({ format: this.selectedFormat as any }));
  }
  onDownload(state: any): void {
    if (!state.outputBlob) return;
    const url = URL.createObjectURL(state.outputBlob);
    const a = Object.assign(document.createElement('a'), {
      href: url, download: `omni_pitch-shifter_${state.inputFile?.name?.replace(/\.[^.]+$/, '') ?? 'audio'}.${this.selectedFormat}`
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 150);
  }
  onReset(): void {
    if (this.blobUrl) { URL.revokeObjectURL(this.blobUrl); this.blobUrl = null; }
    this.store.dispatch(PitchShifterActions.resetState());
  }
  ngOnDestroy(): void {
    if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
    this.store.dispatch(PitchShifterActions.resetState());
  }
}
