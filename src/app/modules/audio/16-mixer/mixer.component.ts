import { Component, ChangeDetectionStrategy, inject, OnDestroy, signal } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger } from '@angular/animations';
import { MixerActions, selectMixerState } from './mixer.store';

@Component({
  selector: 'app-mixer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, DecimalPipe],
  animations: [
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0 }), animate('400ms ease-out', style({ opacity: 1 }))])]),
    trigger('slideUp', [transition(':enter', [style({ opacity: 0, transform: 'translateY(20px)' }), animate('500ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0)' }))])]),
  ],
  template: `
    <div class="h-full w-full bg-[#0a0a0f] text-white p-6 flex flex-col overflow-y-auto" [@fadeIn]>
      <div class="flex justify-between items-center mb-8">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent tracking-tight">🎚️ Multi-Track Mixer</h2>
          <p class="text-gray-400 text-sm mt-1 uppercase tracking-widest">Mix multiple audio tracks with volume, pan, mute & solo</p>
        </div>
        @if ((state$ | async)?.tracks?.length) {
          <button (click)="onReset()" class="px-4 py-2 bg-gray-900 hover:bg-red-900/40 text-gray-400 hover:text-red-400 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors border border-gray-800">Reset</button>
        }
      </div>

      @if (state$ | async; as state) {
        <!-- Track Strips -->
        <div class="flex gap-4 overflow-x-auto pb-4 mb-4">
          @for (track of state.tracks; track track.id) {
            <div class="w-44 shrink-0 bg-[#12121a] border rounded-2xl p-4 flex flex-col gap-3 transition-all"
                 [class]="track.soloed ? 'border-green-500/50' : track.muted ? 'border-gray-700 opacity-50' : 'border-gray-800'">

              <!-- Track Label -->
              <p class="text-xs font-bold text-gray-300 truncate" [title]="track.label">{{ track.label }}</p>

              <!-- Volume Fader -->
              <div class="flex flex-col items-center gap-1">
                <span class="text-[10px] text-gray-500 font-mono">VOL: {{ (track.volume * 100) | number:'1.0-0' }}%</span>
                <input type="range" min="0" max="2" step="0.01" [value]="track.volume" class="w-full accent-pink-500 h-1.5 bg-gray-800 rounded-full appearance-none cursor-pointer"
                        (input)="onVolumeChange($event, track.id)">
              </div>

              <!-- Pan Knob (slider) -->
              <div class="flex flex-col items-center gap-1">
                <span class="text-[10px] text-gray-500 font-mono">PAN: {{ getPanDisplay(track.pan) }}</span>
                <input type="range" min="-1" max="1" step="0.01" [value]="track.pan" class="w-full accent-purple-400 h-1.5 bg-gray-800 rounded-full appearance-none cursor-pointer"
                        (input)="onPanChange($event, track.id)">
              </div>

              <!-- Mute / Solo -->
              <div class="flex gap-2">
                <button (click)="onToggleMute(track.id)" class="flex-1 py-1.5 text-xs font-black rounded-lg border transition-colors"
                        [class]="track.muted ? 'bg-amber-500 border-amber-400 text-black' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-amber-500'">M</button>
                <button (click)="onToggleSolo(track.id)" class="flex-1 py-1.5 text-xs font-black rounded-lg border transition-colors"
                        [class]="track.soloed ? 'bg-green-500 border-green-400 text-black' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-green-500'">S</button>
              </div>

              <!-- Remove -->
              <button (click)="onRemoveTrack(track.id)" class="w-full py-1 text-[10px] font-bold text-gray-600 hover:text-rose-400 hover:bg-rose-900/20 rounded-lg transition-colors border border-transparent hover:border-rose-800">✕ Remove</button>
            </div>
          }

          <!-- Add Track Button -->
          <div class="w-44 shrink-0 bg-[#12121a] border-2 border-dashed border-gray-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 hover:border-pink-500/40 transition-colors cursor-pointer"
               (click)="fileInput.click()"
               (keydown.enter)="fileInput.click()"
               (keydown.space)="fileInput.click()"
               tabindex="0"
               role="button"
               aria-label="Add audio track">
            <div class="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 text-2xl">+</div>
            <p class="text-xs text-gray-500 font-bold text-center">Add Track</p>
            <input #fileInput type="file" accept="audio/*" class="hidden" (change)="onAddTrack($event)">
          </div>

          <!-- Master Strip -->
          @if (state.tracks.length >= 2) {
            <div class="w-44 shrink-0 bg-[#0f0f1a] border border-pink-500/20 rounded-2xl p-4 flex flex-col gap-3">
              <p class="text-xs font-black text-pink-400 uppercase tracking-widest">Master</p>
              <div class="flex flex-col items-center gap-1">
                <span class="text-[10px] text-gray-500 font-mono">{{ (state.masterVolume * 100) | number:'1.0-0' }}%</span>
                <input type="range" min="0" max="2" step="0.01" [value]="state.masterVolume" (input)="onMasterVolChange($event)"
                      class="w-full accent-pink-500 h-1.5 bg-gray-800 rounded-full appearance-none cursor-pointer">
              </div>
              <div class="flex gap-2">
                <button (click)="onSetOutputMode('stereo')" class="flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition-colors"
                        [class]="state.outputMode === 'stereo' ? 'bg-pink-500/10 border-pink-500/40 text-pink-400' : 'bg-gray-900 border-gray-700 text-gray-500'">ST</button>
                <button (click)="onSetOutputMode('mono')" class="flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition-colors"
                        [class]="state.outputMode === 'mono' ? 'bg-pink-500/10 border-pink-500/40 text-pink-400' : 'bg-gray-900 border-gray-700 text-gray-500'">MO</button>
              </div>
            </div>
          }
        </div>

        <!-- Mix Button + Output -->
        @if (state.tracks.length >= 2) {
          <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6" [@slideUp]>
            @if (state.status === 'processing') {
              <div class="flex items-center gap-4 mb-4">
                <div class="relative w-16 h-16">
                  <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle stroke-width="6" stroke="#1f2937" fill="transparent" r="42" cx="50" cy="50" />
                    <circle class="text-pink-500 transition-all" stroke-width="6" stroke="currentColor" fill="transparent" r="42" cx="50" cy="50"
                            stroke-dasharray="264" [style.stroke-dashoffset]="264 - (264 * state.progress) / 100" stroke-linecap="round" />
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center text-xs font-black">{{ state.progress }}%</div>
                </div>
                <div class="flex-1 h-16 bg-black/80 rounded-xl border border-gray-800 p-2 overflow-y-auto font-mono text-[10px] text-gray-500">
                  @for (log of state.logs; track $index) { <div><span class="text-pink-500/50">></span> {{ log }}</div> }
                </div>
              </div>
            }

            @if (state.status === 'done' && state.outputBlob) {
              <div class="flex flex-col gap-3 mb-4" [@slideUp]>
                <audio [src]="getBlobUrl(state.outputBlob)" controls class="w-full outline-none"></audio>
                <button (click)="onDownload(state)" class="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all">⬇ Download Mix ({{ state.outputSizeMB | number:'1.2-2' }} MB)</button>
              </div>
            }

            @if (state.status === 'error') {
              <div class="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">{{ state.errorMessage }}</div>
            }

            @if (state.status !== 'processing' && state.status !== 'done') {
              <button (click)="onMix(state)" class="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90 rounded-xl font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(236,72,153,0.2)] active:scale-95 transition-all">
                🎚️ Render Mix ({{ state.tracks.length }} Tracks)
              </button>
            }
          </div>
        } @else {
          <div class="flex-1 flex flex-col items-center justify-center text-center opacity-40 py-12">
            <p class="text-2xl mb-3">🎚️</p>
            <p class="font-bold text-gray-300">Add at least 2 tracks to mix</p>
            <p class="text-sm text-gray-500 mt-1">Click the + button above or drag audio files</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`:host { display: block; height: 100%; }`]
})
export class MixerComponent implements OnDestroy {
  private store = inject(Store);
  readonly state$ = this.store.select(selectMixerState);
  private cachedBlobUrls = new Map<Blob, string>();

  onAddTrack(e: Event) {
    const file = (e.target as any).files?.[0];
    if (file) this.store.dispatch(MixerActions.addTrack({ file }));
  }
  onRemoveTrack(id: string) { this.store.dispatch(MixerActions.removeTrack({ id })); }
  onVolumeChange(e: Event, id: string) { this.store.dispatch(MixerActions.updateTrackVolume({ id, volume: parseFloat((e.target as any).value) })); }
  onPanChange(e: Event, id: string) { this.store.dispatch(MixerActions.updateTrackPan({ id, pan: parseFloat((e.target as any).value) })); }
  onToggleMute(id: string) { this.store.dispatch(MixerActions.toggleTrackMute({ id })); }
  onToggleSolo(id: string) { this.store.dispatch(MixerActions.toggleTrackSolo({ id })); }
  onMasterVolChange(e: Event) { this.store.dispatch(MixerActions.setMasterVolume({ volume: parseFloat((e.target as any).value) })); }
  onSetOutputMode(mode: 'stereo' | 'mono') { this.store.dispatch(MixerActions.setOutputMode({ mode })); }

  getPanDisplay(pan: number): string {
    if (Math.abs(pan) < 0.03) return 'C';
    return pan < 0 ? `L${Math.round(pan * -100)}` : `R${Math.round(pan * 100)}`;
  }

  onMix(state: any) {
    if (state.status === 'processing') return;
    this.store.dispatch(MixerActions.startMix());
  }

  getBlobUrl(blob: Blob): string {
    if (this.cachedBlobUrls.has(blob)) return this.cachedBlobUrls.get(blob)!;
    const url = URL.createObjectURL(blob); this.cachedBlobUrls.set(blob, url); return url;
  }

  onDownload(state: any) {
    if (!state.outputBlob) return;
    const a = document.createElement('a');
    a.href = this.getBlobUrl(state.outputBlob);
    a.download = `omni_mix_${state.tracks.length}tracks.wav`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  onReset() { this.cachedBlobUrls.forEach(url => URL.revokeObjectURL(url)); this.cachedBlobUrls.clear(); this.store.dispatch(MixerActions.resetState()); }
  ngOnDestroy() { this.onReset(); }
}
