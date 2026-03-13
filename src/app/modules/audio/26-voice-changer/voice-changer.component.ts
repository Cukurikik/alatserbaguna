import { Component, ChangeDetectionStrategy, inject, OnDestroy, signal } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger } from '@angular/animations';
import { VoiceChangerActions, selectVoiceChangerState } from './voice-changer.store';
import { VOICE_PRESETS } from './voice-changer.service';
import { AudioDropZoneComponent } from '../shared/components/audio-drop-zone/audio-drop-zone.component';
import { ExportFormat } from '../shared/types/audio.types';
import { VoicePreset } from './voice-changer.schema';

@Component({
  selector: 'app-voice-changer',
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
          <h2 class="text-4xl font-black bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent tracking-tight">🎭 Voice Changer</h2>
          <p class="text-gray-400 text-sm mt-1 uppercase tracking-widest">Pitch shift · Robot · Chipmunk · Echo · Gender swap</p>
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
                <div class="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 text-xl">🎭</div>
                <div><h3 class="font-bold">{{ state.inputFile.name }}</h3><p class="text-xs text-gray-500 font-mono mt-1">{{ (state.inputFile.size/1024/1024) | number:'1.2-2' }} MB</p></div>
              </div>

              <!-- Preset Grid -->
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6">
                <label class="block text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Voice Preset</label>
                <div class="grid grid-cols-4 gap-3">
                  @for (p of presets; track p.id) {
                    <button (click)="selectPreset(p.id)" class="p-4 rounded-xl border flex flex-col items-center gap-2 transition-all"
                            [class]="selectedPreset() === p.id ? 'bg-violet-500/15 border-violet-500/50' : 'bg-gray-900/50 border-gray-800 hover:border-gray-600'">
                      <span class="text-2xl">{{ p.icon }}</span>
                      <span class="text-[10px] font-black uppercase tracking-wide" [class]="selectedPreset() === p.id ? 'text-violet-400' : 'text-gray-400'">{{ p.label }}</span>
                    </button>
                  }
                </div>
              </div>

              <!-- Manual Controls -->
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col gap-5">
                <h3 class="text-xs font-black text-gray-500 uppercase tracking-widest">Manual Fine-tune</h3>

                <div class="flex flex-col gap-2">
                  <div class="flex justify-between"><label class="text-sm font-bold text-gray-300">Pitch</label><span class="text-violet-400 font-mono font-black text-sm">{{ pitchSemitones() > 0 ? '+' : '' }}{{ pitchSemitones() }} st</span></div>
                  <input type="range" min="-12" max="12" step="0.5" [value]="pitchSemitones()" (input)="pitchSemitones.set(+$any($event.target).value)"
                        class="w-full accent-violet-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer">
                </div>

                <div class="flex flex-col gap-2">
                  <div class="flex justify-between"><label class="text-sm font-bold text-gray-300">Speed</label><span class="text-purple-400 font-mono font-black text-sm">{{ speed() }}x</span></div>
                  <input type="range" min="0.5" max="2.0" step="0.05" [value]="speed()" (input)="speed.set(+$any($event.target).value)"
                        class="w-full accent-purple-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer">
                </div>

                <div class="flex flex-col gap-2">
                  <div class="flex justify-between"><label class="text-sm font-bold text-gray-300">Echo Delay</label><span class="text-fuchsia-400 font-mono font-black text-sm">{{ echoDelay() }} ms</span></div>
                  <input type="range" min="0" max="2000" step="50" [value]="echoDelay()" (input)="echoDelay.set(+$any($event.target).value)"
                        class="w-full accent-fuchsia-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer">
                </div>
              </div>
            </div>

            <div class="w-full lg:w-80 flex flex-col gap-6">
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col min-h-[300px]">
                <label class="text-xs text-gray-400 uppercase tracking-widest mb-3 font-bold">Format</label>
                <select [value]="outputFormat()" (change)="outputFormat.set($any($event.target).value)"
                        class="w-full bg-gray-900 border border-gray-700 font-bold text-sm rounded-lg px-4 py-3 outline-none focus:border-violet-500 transition-colors mb-6">
                  <option value="mp3">MP3</option><option value="wav">WAV</option><option value="aac">AAC</option>
                </select>

                @if (state.status === 'processing') {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6" [@fadeIn]>
                    <div class="relative w-24 h-24 mb-4">
                      <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100"><circle stroke-width="4" stroke="#1f2937" fill="transparent" r="46" cx="50" cy="50"/><circle class="text-violet-500" stroke-width="4" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50" stroke-dasharray="290" [style.stroke-dashoffset]="290-(290*state.progress)/100" stroke-linecap="round"/></svg>
                      <div class="absolute inset-0 flex items-center justify-center text-lg font-black">{{ state.progress }}%</div>
                    </div>
                  </div>
                }

                @if (state.status === 'done' && state.outputBlob) {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6 gap-3 text-center" [@slideUp]>
                    <div class="text-3xl">✅</div>
                    <p class="font-black text-lg text-white">{{ selectedPreset() }} Voice!</p>
                    <audio [src]="getBlobUrl(state.outputBlob)" controls class="w-full outline-none mt-2"></audio>
                  </div>
                }

                @if (state.status === 'error') { <div class="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">{{ state.errorMessage }}</div> }

                <div class="mt-auto">
                  @if (state.status === 'done') {
                    <button (click)="onDownload(state)" class="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl font-black text-sm uppercase active:scale-95 transition-all">⬇ Download</button>
                  } @else {
                    <button (click)="onProcess(state)" [disabled]="state.status === 'processing'"
                        class="w-full py-4 rounded-xl font-black text-sm uppercase transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        [class]="state.status === 'processing' ? 'bg-gray-800 text-violet-400' : 'bg-gradient-to-r from-violet-500 to-purple-500 hover:opacity-90 active:scale-95 shadow-[0_0_20px_rgba(139,92,246,0.2)]'">
                      @if (state.status === 'processing') { <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Transforming... } @else { 🎭 Apply Effect }
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
export class VoiceChangerComponent implements OnDestroy {
  private store = inject(Store);
  readonly state$ = this.store.select(selectVoiceChangerState);
  outputFormat = signal<ExportFormat>('mp3');
  selectedPreset = signal<VoicePreset>('original');
  pitchSemitones = signal(0);
  speed = signal(1.0);
  echoDelay = signal(0);
  private cachedBlobUrls = new Map<Blob, string>();

  readonly presets = [
    { id: 'original' as VoicePreset,       icon: '🎤', label: 'Original' },
    { id: 'male-to-female' as VoicePreset,  icon: '👩', label: 'Girl' },
    { id: 'female-to-male' as VoicePreset,  icon: '👨', label: 'Man' },
    { id: 'chipmunk' as VoicePreset,        icon: '🐿️', label: 'Chipmunk' },
    { id: 'giant' as VoicePreset,           icon: '🦣', label: 'Giant' },
    { id: 'robot' as VoicePreset,           icon: '🤖', label: 'Robot' },
    { id: 'echo' as VoicePreset,            icon: '🔊', label: 'Echo' },
    { id: 'original' as VoicePreset,        icon: '🎛️', label: 'Custom' },
  ];

  selectPreset(preset: VoicePreset) {
    this.selectedPreset.set(preset);
    const p = VOICE_PRESETS[preset];
    this.pitchSemitones.set(p.pitchSemitones);
    this.speed.set(p.speed);
    this.echoDelay.set(p.echoDelay);
  }

  onFileSelected(files: File[]) { if (files.length) this.store.dispatch(VoiceChangerActions.loadFile({ file: files[0] })); }
  onProcess(state: any) {
    if (state.status === 'processing') return;
    this.store.dispatch(VoiceChangerActions.startProcessing({
      format: this.outputFormat(),
      params: { pitchSemitones: this.pitchSemitones(), speed: this.speed(), robotMode: this.selectedPreset() === 'robot', robotFrequency: 100, echoDelay: this.echoDelay(), echoDecay: 0.5 }
    }));
  }
  getBlobUrl(blob: Blob): string {
    if (!this.cachedBlobUrls.has(blob)) this.cachedBlobUrls.set(blob, URL.createObjectURL(blob));
    return this.cachedBlobUrls.get(blob)!;
  }
  onDownload(state: any) {
    if (!state.outputBlob) return;
    const a = document.createElement('a'); a.href = this.getBlobUrl(state.outputBlob);
    a.download = `omni_voice_${this.selectedPreset()}_${state.inputFile?.name?.replace(/\.[^.]+$/, '')}.${this.outputFormat()}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }
  onReset() { this.cachedBlobUrls.forEach(url => URL.revokeObjectURL(url)); this.cachedBlobUrls.clear(); this.store.dispatch(VoiceChangerActions.resetState()); }
  ngOnDestroy() { this.onReset(); }
}
