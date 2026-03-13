import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { TrimmerActions, selectTrimmerState } from './trimmer.store';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { ExportPanelComponent } from '../shared/components/export-panel/export-panel.component';

@Component({
  selector: 'app-trimmer',
  standalone: true,
  imports: [
    AsyncPipe, 
    FileDropZoneComponent, 
    VideoPreviewComponent, 
    ProgressRingComponent, 
    ExportPanelComponent
  ],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl backdrop-blur-md bg-opacity-80 p-6 flex flex-col overflow-y-auto custom-scrollbar">
      
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent drop-shadow-sm pb-1">Video Trimmer</h2>
        <p class="text-gray-400 text-sm mt-1">Extract the best moments from your high-res footage with frame-level precision.</p>
      </div>

      @if (state$ | async; as state) {
        
        <!-- Upload State -->
        @if (!state.inputFile) {
          <div class="flex-1 flex flex-col justify-center">
            <app-file-drop-zone 
              accept="video/*" 
              (fileDropped)="onFileSelected($event)">
            </app-file-drop-zone>
          </div>
        }

        <!-- Editor State -->
        @if (state.inputFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-6">
            
            <!-- Left Column: Video & Preview -->
            <div class="flex-1 flex flex-col gap-6">
              <app-video-preview 
                [videoUrl]="videoUrl" 
                (durationLoaded)="onDurationLoaded($event)">
              </app-video-preview>

              <!-- Custom Range Slider Placeholder -->
              <div class="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl relative mt-2">
                <h3 class="text-lg font-semibold text-white mb-4">Trim Range</h3>
                
                <div class="flex items-center space-x-4 mb-4">
                  <div class="flex-1 bg-gray-900 p-3 rounded-lg border border-gray-700">
                    <span class="block text-xs text-gray-400 uppercase tracking-widest mb-1">Start Time</span>
                    <input type="number"
                           class="w-full bg-transparent text-white font-mono outline-none"
                           [value]="state.startTime"
                           step="0.1" min="0" 
                           [max]="state.endTime - 0.5"
                           (change)="onStartChange($event)">
                  </div>
                  <div class="text-gray-500 font-mono">-</div>
                  <div class="flex-1 bg-gray-900 p-3 rounded-lg border border-gray-700">
                    <span class="block text-xs text-gray-400 uppercase tracking-widest mb-1">End Time</span>
                    <input type="number"
                           class="w-full bg-transparent text-white font-mono outline-none"
                           [value]="state.endTime"
                           step="0.1" 
                           [min]="state.startTime + 0.5"
                           (change)="onEndChange($event)">
                  </div>
                </div>

              </div>
            </div>

            <!-- Right Column: Settings & Export -->
            <div class="w-full lg:w-96 flex flex-col gap-6">
              
              <app-export-panel
                [disabled]="state.status === 'processing'"
                (formatChange)="onFormatSelected($event)"
                (exportClicked)="onStartExport()">
              </app-export-panel>

              <!-- Processing Overlay / Inline -->
              @if (state.status === 'processing') {
                <div class="bg-gray-800 rounded-xl p-8 border border-gray-700 flex flex-col items-center justify-center shadow-xl">
                   <app-progress-ring [progress]="state.progress" [status]="'Trimming...'"></app-progress-ring>
                   <p class="text-gray-400 text-sm mt-4 text-center">Applying WASM accelerated cutting algorithms...</p>
                </div>
              }

              <!-- Success State -->
              @if (state.status === 'success') {
                <div class="bg-gradient-to-br from-green-900/40 to-emerald-900/20 border border-green-800 rounded-xl p-6 flex flex-col items-center justify-center shadow-xl">
                   <div class="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                      <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                   </div>
                   <h3 class="text-lg font-bold text-white mb-2">Trim Complete!</h3>
                   <button 
                      class="mt-2 w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-semibold shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all flex items-center justify-center gap-2"
                      (click)="onDownload()">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                      </svg>
                      Download Trimmed Video
                   </button>
                   <button class="mt-4 text-sm text-gray-400 hover:text-white transition-colors" (click)="onReset()">
                     Start New Trim
                   </button>
                </div>
              }

            </div>
          </div>
        }

      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrimmerComponent {
  private store = inject(Store);
  state$ = this.store.select(selectTrimmerState);
  
  videoUrl: string | null = null;

  onFileSelected(file: File): void {
    if (this.videoUrl) {
      URL.revokeObjectURL(this.videoUrl);
    }
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(TrimmerActions.loadFile({ file }));
  }

  onDurationLoaded(duration: number): void {
    this.store.dispatch(TrimmerActions.loadMetaSuccess({
      meta: {
        filename: 'video',
        fileSizeMB: 0,
        duration,
        width: 1920,
        height: 1080,
        fps: 30,
        codec: 'h264',
        audioCodec: 'aac',
        audioBitrate: 128,
        videoBitrate: 0,
        hasAudio: true,
        aspectRatio: '16:9',
      }
    }));
  }

  onStartChange(event: Event): void {
    const time = parseFloat((event.target as HTMLInputElement).value);
    this.store.dispatch(TrimmerActions.setStartTime({ time }));
  }

  onEndChange(event: Event): void {
    const time = parseFloat((event.target as HTMLInputElement).value);
    this.store.dispatch(TrimmerActions.setEndTime({ time }));
  }

  onFormatSelected(format: string): void {
    this.store.dispatch(TrimmerActions.setOutputFormat({ format }));
  }

  onStartExport(): void {
    this.store.dispatch(TrimmerActions.startProcessing());
  }

  onDownload(): void {
    this.store.dispatch(TrimmerActions.downloadOutput());
  }

  onReset(): void {
    if (this.videoUrl) {
      URL.revokeObjectURL(this.videoUrl);
      this.videoUrl = null;
    }
    this.store.dispatch(TrimmerActions.resetState());
  }
}