import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';

interface ReverserState { status: 'idle'|'processing'|'success'|'error'; progress: number; inputFile: File|null; outputBlob: Blob|null; }
const initialState: ReverserState = { status: 'idle', progress: 0, inputFile: null, outputBlob: null };

const ReverserActions = createActionGroup({ source: 'Reverser', events: {
  'Load File': props<{ file: File }>(),
  'Start Processing': emptyProps(),
  'Update Progress': props<{ progress: number }>(),
  'Processing Success': props<{ outputBlob: Blob }>(),
  'Reset State': emptyProps(),
}});

const reverserFeature = createFeature({ name: 'reverser', reducer: createReducer(initialState,
  on(ReverserActions.loadFile, (s, { file }) => ({ ...s, inputFile: file })),
  on(ReverserActions.startProcessing, (s) => ({ ...s, status: 'processing', progress: 0 })),
  on(ReverserActions.updateProgress, (s, { progress }) => ({ ...s, progress })),
  on(ReverserActions.processingSuccess, (s, { outputBlob }) => ({ ...s, status: 'success', outputBlob, progress: 100 })),
  on(ReverserActions.resetState, () => initialState),
)});

@Component({
  selector: 'app-reverser',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-rose-400 to-red-500 bg-clip-text text-transparent pb-1">Video Reverser</h2>
        <p class="text-gray-400 text-sm mt-1">Play video in reverse using FFmpeg's reverse filter. Perfect for rewind effects.</p>
      </div>

      @if (vm$ | async; as vm) {
        @if (!vm.inputFile) {
          <div class="flex-1 flex flex-col justify-center">
            <app-file-drop-zone accept="video/*" (fileDropped)="onFile($event)"></app-file-drop-zone>
          </div>
        } @else {
          <div class="flex flex-col lg:flex-row gap-6">
            <div class="flex-1"><app-video-preview [videoUrl]="videoUrl"></app-video-preview></div>
            <div class="w-full lg:w-80 flex flex-col gap-4">

              <div class="bg-gray-800 border border-gray-700 rounded-xl p-5 text-center">
                <div class="w-20 h-20 mx-auto rounded-full bg-rose-900/40 flex items-center justify-center mb-3">
                  <svg class="w-10 h-10 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"/>
                  </svg>
                </div>
                <p class="text-sm text-gray-400">This will reverse the video and audio.<br>Processing time depends on file size.</p>
                <div class="mt-4 bg-gray-900 rounded-lg p-3 font-mono text-xs text-cyan-300 text-left">
                  ffmpeg -i input.mp4 -vf reverse<br>-af areverse output.mp4
                </div>
              </div>

              @if (vm.status === 'processing') {
                <div class="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col items-center">
                  <app-progress-ring [progress]="vm.progress" [status]="'Reversing...'"></app-progress-ring>
                </div>
              } @else if (vm.status === 'success') {
                <button (click)="onDownload(vm)" class="w-full bg-rose-600 hover:bg-rose-500 text-white py-3 rounded-xl font-bold transition-all flex justify-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  Download Reversed
                </button>
                <button (click)="onReset()" class="text-sm text-center text-gray-400 hover:text-white mt-2">Try Another</button>
              } @else {
                <button (click)="onProcess(vm)" class="w-full bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-400 hover:to-red-400 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all active:scale-95">
                  ⏪ Reverse Video
                </button>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReverserComponent {
  private store = inject(Store);
  private workerBridge = inject(WorkerBridgeService);
  readonly vm$ = this.store.select(reverserFeature.selectReverserState);
  videoUrl: string | null = null;

  onFile(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(ReverserActions.loadFile({ file }));
  }

  onProcess(state: ReverserState): void {
    this.store.dispatch(ReverserActions.startProcessing());
    if (state.inputFile) {
      const worker = new Worker(new URL('./reverser.worker', import.meta.url), { type: 'module' });
      this.workerBridge.runTask(worker, { file: state.inputFile }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') this.store.dispatch(ReverserActions.updateProgress({ progress: msg.value }));
          else if (msg.type === 'complete') this.store.dispatch(ReverserActions.processingSuccess({ outputBlob: new Blob([msg.data as BlobPart], { type: 'video/mp4' }) }));
        }
      });
    }
  }

  onDownload(state: ReverserState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const a = Object.assign(document.createElement('a'), { href: url, download: 'omni_reversed.mp4' });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  onReset(): void {
    if (this.videoUrl) { URL.revokeObjectURL(this.videoUrl); this.videoUrl = null; }
    this.store.dispatch(ReverserActions.resetState());
  }
}