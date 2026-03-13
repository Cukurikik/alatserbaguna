import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';

interface RecorderState { status: 'idle'|'recording'|'paused'|'done'|'error'; progress: number; duration: number; outputBlob: Blob|null; quality: 'high'|'medium'|'low'; includeAudio: boolean; }
const initialState: RecorderState = { status: 'idle', progress: 0, duration: 0, outputBlob: null, quality: 'high', includeAudio: true };

const RecorderActions = createActionGroup({ source: 'ScreenRecorder', events: {
  'Start Recording': emptyProps(),
  'Pause Recording': emptyProps(),
  'Resume Recording': emptyProps(),
  'Stop Recording': emptyProps(),
  'Tick Duration': props<{ duration: number }>(),
  'Set Quality': props<{ quality: 'high'|'medium'|'low' }>(),
  'Toggle Audio': emptyProps(),
  'Recording Done': props<{ outputBlob: Blob }>(),
  'Reset State': emptyProps(),
}});

const recorderFeature = createFeature({ name: 'screenRecorder', reducer: createReducer(initialState,
  on(RecorderActions.startRecording, (s) => ({ ...s, status: 'recording', duration: 0, outputBlob: null })),
  on(RecorderActions.pauseRecording, (s) => ({ ...s, status: 'paused' })),
  on(RecorderActions.resumeRecording, (s) => ({ ...s, status: 'recording' })),
  on(RecorderActions.stopRecording, (s) => ({ ...s, status: 'idle' })),
  on(RecorderActions.tickDuration, (s, { duration }) => ({ ...s, duration })),
  on(RecorderActions.setQuality, (s, { quality }) => ({ ...s, quality })),
  on(RecorderActions.toggleAudio, (s) => ({ ...s, includeAudio: !s.includeAudio })),
  on(RecorderActions.recordingDone, (s, { outputBlob }) => ({ ...s, status: 'done', outputBlob })),
  on(RecorderActions.resetState, () => initialState),
)});

const QUALITY_MAP = { high: { videoBitsPerSecond: 8000000 }, medium: { videoBitsPerSecond: 4000000 }, low: { videoBitsPerSecond: 1500000 } };

@Component({
  selector: 'app-screen-recorder',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-red-400 to-rose-500 bg-clip-text text-transparent pb-1">Screen Recorder</h2>
        <p class="text-gray-400 text-sm mt-1">Capture your screen or any media stream using the MediaRecorder API. No server needed.</p>
      </div>

      @if (vm$ | async; as vm) {
        <div class="flex flex-col items-center gap-8 py-8">
          <!-- Duration Display -->
          <div class="relative">
            <div [class]="vm.status === 'recording' ? 'shadow-[0_0_60px_rgba(239,68,68,0.6)]' : ''"
              class="w-48 h-48 rounded-full bg-gray-800 border-4 border-gray-700 flex flex-col items-center justify-center transition-all duration-500">
              @if (vm.status === 'recording') {
                <div class="w-4 h-4 rounded-full bg-red-500 mb-3 animate-pulse"></div>
              } @else if (vm.status === 'paused') {
                <div class="text-yellow-400 text-2xl mb-2">⏸</div>
              } @else if (vm.status === 'done') {
                <div class="text-green-400 text-3xl mb-2">✓</div>
              } @else {
                <div class="text-gray-600 text-4xl mb-2">●</div>
              }
              <span class="font-mono text-4xl font-bold text-white">{{ fmtDuration(vm.duration) }}</span>
              <span class="text-xs text-gray-500 mt-1">{{ vm.status | uppercase }}</span>
            </div>
          </div>

          <!-- Controls -->
          <div class="flex gap-4">
            @if (vm.status === 'idle' || vm.status === 'done') {
              <button (click)="startRecording(vm)"
                class="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-4 rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all active:scale-95 text-lg">
                <div class="w-4 h-4 rounded-full bg-white"></div> Start Recording
              </button>
            }
            @if (vm.status === 'recording') {
              <button (click)="pause()" class="bg-yellow-600 hover:bg-yellow-500 text-white font-bold px-6 py-4 rounded-2xl transition-all">⏸ Pause</button>
              <button (click)="stop()" class="bg-gray-700 hover:bg-gray-600 text-white font-bold px-6 py-4 rounded-2xl transition-all">⏹ Stop</button>
            }
            @if (vm.status === 'paused') {
              <button (click)="resume()" class="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-4 rounded-2xl transition-all">▶ Resume</button>
              <button (click)="stop()" class="bg-gray-700 hover:bg-gray-600 text-white font-bold px-6 py-4 rounded-2xl transition-all">⏹ Stop</button>
            }
          </div>

          <!-- Settings Row -->
          <div class="flex flex-wrap gap-4 justify-center">
            <!-- Quality -->
            <div class="bg-gray-800 border border-gray-700 rounded-xl p-4 flex gap-2">
              @for (q of qualities; track q) {
                <button (click)="setQuality(q)"
                  [class]="vm.quality === q ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
                  [disabled]="vm.status === 'recording' || vm.status === 'paused'"
                  class="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize disabled:opacity-50">{{ q }}</button>
              }
            </div>
            <!-- Audio Toggle -->
            <button (click)="toggleAudio()"
              [disabled]="vm.status === 'recording' || vm.status === 'paused'"
              [class]="vm.includeAudio ? 'bg-green-700 border-green-600' : 'bg-gray-800 border-gray-700'"
              class="border px-4 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2">
              <span>{{ vm.includeAudio ? '🎤' : '🔇' }}</span>
              <span class="text-white">{{ vm.includeAudio ? 'Mic On' : 'Mic Off' }}</span>
            </button>
          </div>

          <!-- Download -->
          @if (vm.status === 'done' && vm.outputBlob) {
            <button (click)="onDownload(vm)" class="bg-green-600 hover:bg-green-500 text-white font-bold px-8 py-4 rounded-2xl flex items-center gap-3 shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Download Recording ({{ (vm.outputBlob.size / 1024 / 1024).toFixed(1) }} MB)
            </button>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScreenRecorderComponent implements OnDestroy {
  private store = inject(Store);
  readonly vm$ = this.store.select(recorderFeature.selectScreenRecorderState);
  readonly qualities: ('high'|'medium'|'low')[] = ['high', 'medium', 'low'];

  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private startTime = 0;

  fmtDuration(s: number): string { const m = Math.floor(s / 60); return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }

  setQuality(quality: 'high'|'medium'|'low'): void { this.store.dispatch(RecorderActions.setQuality({ quality })); }
  toggleAudio(): void { this.store.dispatch(RecorderActions.toggleAudio()); }
  pause(): void { this.mediaRecorder?.pause(); this.store.dispatch(RecorderActions.pauseRecording()); if (this.timerInterval) clearInterval(this.timerInterval); }
  resume(): void { this.mediaRecorder?.resume(); this.store.dispatch(RecorderActions.resumeRecording()); this.startTimer(); }
  stop(): void { this.mediaRecorder?.stop(); if (this.timerInterval) clearInterval(this.timerInterval); }

  async startRecording(state: RecorderState): Promise<void> {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const streams: MediaStream[] = [displayStream];
      if (state.includeAudio) {
        try { const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true }); streams.push(audioStream); } catch {}
      }
      const combinedStream = new MediaStream([...streams.flatMap(s => [...s.getTracks()])]);
      this.chunks = [];
      this.mediaRecorder = new MediaRecorder(combinedStream, QUALITY_MAP[state.quality]);
      this.mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) this.chunks.push(e.data); };
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'video/webm' });
        this.store.dispatch(RecorderActions.recordingDone({ outputBlob: blob }));
        combinedStream.getTracks().forEach(t => t.stop());
      };
      this.mediaRecorder.start(1000);
      this.store.dispatch(RecorderActions.startRecording());
      this.startTimer();
    } catch (err: any) { console.error(err); }
  }

  private startTimer(): void {
    this.startTime = Date.now();
    let duration = 0;
    this.timerInterval = setInterval(() => { duration++; this.store.dispatch(RecorderActions.tickDuration({ duration })); }, 1000);
  }

  onDownload(state: RecorderState): void {
    if (state.outputBlob) { const url = URL.createObjectURL(state.outputBlob); const a = Object.assign(document.createElement('a'), { href: url, download: `omni_screen_${Date.now()}.webm` }); document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 150); }
  }

  ngOnDestroy(): void { if (this.timerInterval) clearInterval(this.timerInterval); this.mediaRecorder?.stop(); }
}