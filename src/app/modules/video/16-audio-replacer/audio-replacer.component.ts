import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';

interface AudioReplacerState { status: 'idle'|'processing'|'success'|'error'; progress: number; videoFile: File|null; audioFile: File|null; outputBlob: Blob|null; volume: number; delay: number; }
const initialState: AudioReplacerState = { status: 'idle', progress: 0, videoFile: null, audioFile: null, outputBlob: null, volume: 1, delay: 0 };

const AudioReplacerActions = createActionGroup({ source: 'AudioReplacer', events: {
  'Load Video': props<{ file: File }>(),
  'Load Audio': props<{ file: File }>(),
  'Set Volume': props<{ volume: number }>(),
  'Set Delay': props<{ delay: number }>(),
  'Start Processing': emptyProps(),
  'Update Progress': props<{ progress: number }>(),
  'Processing Success': props<{ outputBlob: Blob }>(),
  'Processing Failure': props<{ message: string }>(),
  'Reset State': emptyProps(),
}});

const audioReplacerFeature = createFeature({ name: 'audioReplacer', reducer: createReducer(initialState,
  on(AudioReplacerActions.loadVideo, (s, { file }) => ({ ...s, videoFile: file })),
  on(AudioReplacerActions.loadAudio, (s, { file }) => ({ ...s, audioFile: file })),
  on(AudioReplacerActions.setVolume, (s, { volume }) => ({ ...s, volume })),
  on(AudioReplacerActions.setDelay, (s, { delay }) => ({ ...s, delay })),
  on(AudioReplacerActions.startProcessing, (s) => ({ ...s, status: 'processing', progress: 0 })),
  on(AudioReplacerActions.updateProgress, (s, { progress }) => ({ ...s, progress })),
  on(AudioReplacerActions.processingSuccess, (s, { outputBlob }) => ({ ...s, status: 'success', outputBlob, progress: 100 })),
  on(AudioReplacerActions.processingFailure, (s) => ({ ...s, status: 'error' })),
  on(AudioReplacerActions.resetState, () => initialState),
)});

@Component({
  selector: 'app-audio-replacer',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent pb-1">Replace Audio</h2>
        <p class="text-gray-400 text-sm mt-1">Strip original audio and mux a new audio file into the video using FFmpeg -map.</p>
      </div>

      @if (vm$ | async; as vm) {
        <div class="flex flex-col lg:flex-row gap-6">
          <div class="flex-1 flex flex-col gap-4">
            @if (!vm.videoFile) {
              <app-file-drop-zone accept="video/*" (fileDropped)="onVideoFile($event)"></app-file-drop-zone>
            } @else {
              <app-video-preview [videoUrl]="videoUrl"></app-video-preview>
            }
            <!-- Audio drop zone -->
            <div role="button" tabindex="0" aria-label="Drop audio file"
              (click)="audioInput.click()" (keydown.enter)="audioInput.click()"
              [class]="vm.audioFile ? 'border-blue-500 bg-blue-900/20' : 'border-gray-600 hover:border-blue-400'"
              class="border-2 border-dashed rounded-xl p-6 flex items-center gap-4 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
              <div class="w-12 h-12 rounded-full bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
              </div>
              @if (vm.audioFile) {
                <div>
                  <p class="text-blue-300 font-medium">{{ vm.audioFile.name }}</p>
                  <p class="text-gray-500 text-xs">{{ (vm.audioFile.size / 1024 / 1024).toFixed(2) }} MB</p>
                </div>
              } @else {
                <p class="text-gray-400">Drop replacement audio (MP3, WAV, AAC, OGG)</p>
              }
              <input #audioInput type="file" accept="audio/*" class="hidden" (change)="onAudioFile($event)">
            </div>
          </div>

          <div class="w-full lg:w-72 flex flex-col gap-4">
            <!-- Volume -->
            <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div class="flex justify-between mb-2">
                <label class="text-sm font-semibold text-gray-300">Audio Volume</label>
                <span class="text-blue-400 font-mono">{{ (vm.volume * 100).toFixed(0) }}%</span>
              </div>
              <input type="range" min="0" max="2" step="0.01" [value]="vm.volume" (input)="setVolume($event)" class="w-full accent-blue-400">
            </div>
            <!-- Delay -->
            <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div class="flex justify-between mb-2">
                <label class="text-sm font-semibold text-gray-300">Audio Delay</label>
                <span class="text-blue-400 font-mono">{{ vm.delay }}ms</span>
              </div>
              <input type="range" min="-2000" max="2000" step="100" [value]="vm.delay" (input)="setDelay($event)" class="w-full accent-blue-400">
            </div>
            <!-- Info -->
            <div class="bg-gray-950 rounded-xl p-4 border border-gray-700">
              <p class="text-xs text-gray-500 mb-1 uppercase tracking-wider">FFmpeg Command</p>
              <p class="font-mono text-xs text-blue-300">ffmpeg -i video.mp4 -i audio.mp3 -map 0:v -map 1:a -c:v copy @if (vm.volume !== 1) { -af volume={{ vm.volume }} } -shortest output.mp4</p>
            </div>

            @if (vm.status === 'processing') {
              <div class="bg-gray-800 rounded-xl p-6 flex flex-col items-center"><app-progress-ring [progress]="vm.progress" [status]="'Replacing audio...'"></app-progress-ring></div>
            } @else if (vm.status === 'success') {
              <button (click)="onDownload(vm)" class="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold">Download with New Audio</button>
              <button (click)="onReset()" class="text-sm text-center text-gray-400 hover:text-white">Try Another</button>
            } @else {
              <button (click)="onProcess(vm)" [disabled]="!vm.videoFile || !vm.audioFile"
                class="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all active:scale-95 disabled:opacity-50">
                🎙 Replace Audio
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AudioReplacerComponent {
  private store = inject(Store);
  private workerBridge = inject(WorkerBridgeService);
  readonly vm$ = this.store.select(audioReplacerFeature.selectAudioReplacerState);
  videoUrl: string | null = null;

  onVideoFile(file: File): void { if (this.videoUrl) URL.revokeObjectURL(this.videoUrl); this.videoUrl = URL.createObjectURL(file); this.store.dispatch(AudioReplacerActions.loadVideo({ file })); }
  onAudioFile(e: Event): void { const f = (e.target as HTMLInputElement).files?.[0]; if (f) this.store.dispatch(AudioReplacerActions.loadAudio({ file: f })); }
  setVolume(e: Event): void { this.store.dispatch(AudioReplacerActions.setVolume({ volume: +(e.target as HTMLInputElement).value })); }
  setDelay(e: Event): void { this.store.dispatch(AudioReplacerActions.setDelay({ delay: +(e.target as HTMLInputElement).value })); }

  onProcess(state: AudioReplacerState): void {
    this.store.dispatch(AudioReplacerActions.startProcessing());
    if (state.videoFile && state.audioFile) {
      const worker = new Worker(new URL('./audio-replacer.worker', import.meta.url), { type: 'module' });
      this.workerBridge.runTask(worker, { videoFile: state.videoFile, audioFile: state.audioFile, volume: state.volume, delay: state.delay }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') this.store.dispatch(AudioReplacerActions.updateProgress({ progress: msg.value }));
          else if (msg.type === 'complete') this.store.dispatch(AudioReplacerActions.processingSuccess({ outputBlob: new Blob([msg.data as BlobPart], { type: 'video/mp4' }) }));
        },
        error: (err) => this.store.dispatch(AudioReplacerActions.processingFailure({ message: err.message }))
      });
    }
  }

  onDownload(state: AudioReplacerState): void {
    if (state.outputBlob) { const url = URL.createObjectURL(state.outputBlob); const a = Object.assign(document.createElement('a'), { href: url, download: 'omni_replaced_audio.mp4' }); document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 150); }
  }

  onReset(): void { if (this.videoUrl) { URL.revokeObjectURL(this.videoUrl); this.videoUrl = null; } this.store.dispatch(AudioReplacerActions.resetState()); }
}