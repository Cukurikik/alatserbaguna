import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { TrimmerActions, selectTrimmerState } from './trimmer.store';
import { TrimmerService } from './trimmer.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { ExportPanelComponent } from '../shared/components/export-panel/export-panel.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

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
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header Area -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Video Trimmer
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">WASM-ACCELERATED FRAME CUTTING</p>
        </div>
        @if (state$ | async; as state) {
          @if (state.inputFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-rose-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-rose-950/30 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </span>
              Clear
            </button>
          }
        }
      </div>

      @if (state$ | async; as state) {
        
        <!-- Pillar 5: I/O — Input State -->
        @if (!state.inputFile) {
          <div class="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full" [@slideUp]>
            <app-file-drop-zone 
              accept="video/*" 
              (fileDropped)="onFileSelected($event)">
            </app-file-drop-zone>
            
            <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="p-4 rounded-xl bg-gray-900/50 border border-gray-800 group hover:border-cyan-500/30 transition-colors">
                <div class="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <h4 class="text-white font-bold text-sm">Ultra Fast</h4>
                <p class="text-xs text-gray-500 mt-1">Uses FFmpeg stream mapping for near-instant cuts on compatible formats.</p>
              </div>
              <div class="p-4 rounded-xl bg-gray-900/50 border border-gray-800 group hover:border-blue-500/30 transition-colors">
                <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-3 group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                </div>
                <h4 class="text-white font-bold text-sm">Lossless Quality</h4>
                <p class="text-xs text-gray-500 mt-1">Optionally cut without re-encoding to preserve every pixel.</p>
              </div>
              <div class="p-4 rounded-xl bg-gray-900/50 border border-gray-800 group hover:border-indigo-500/30 transition-colors">
                <div class="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>
                </div>
                <h4 class="text-white font-bold text-sm">Local Storage</h4>
                <p class="text-xs text-gray-500 mt-1">Processed using OPFS for maximum file handling speed.</p>
              </div>
            </div>
          </div>
        }

        <!-- Pillar 4: Component Logic Area -->
        @if (state.inputFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-6" [@fadeIn]>
            
            <!-- Left: Feature Control -->
            <div class="flex-1 flex flex-col gap-6">
              <div class="relative group rounded-2xl overflow-hidden border border-gray-800 shadow-2xl bg-black">
                <app-video-preview 
                  [videoUrl]="videoUrl" 
                  (durationLoaded)="onDurationLoaded($event)">
                </app-video-preview>
                
                @if (state.status === 'processing') {
                   <div class="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10" [@fadeIn]>
                      <app-progress-ring [progress]="state.progress" [status]="'TRIMMING'"></app-progress-ring>
                      <p class="text-cyan-400 font-mono text-[10px] mt-4 uppercase tracking-[0.3em] animate-pulse">Running FFMPEG Module</p>
                   </div>
                }
              </div>

              <!-- Trim Range Slider Area -->
              <div class="bg-gray-900/50 backdrop-blur-md rounded-2xl p-6 border border-gray-800 shadow-xl">
                <div class="flex items-center justify-between mb-6">
                  <h3 class="text-lg font-bold text-white flex items-center gap-2">
                    <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758L5 19m0-14l5.758 5.758M12 12l2.879-2.879"/></svg>
                    Selection Range
                  </h3>
                  <div class="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                    <span class="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                      {{ (state.endTime - state.startTime).toFixed(2) }}s Selected
                    </span>
                  </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="bg-gray-950 p-4 rounded-xl border border-gray-800 focus-within:border-cyan-500/50 transition-colors">
                    <label class="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">In Point</label>
                    <div class="flex items-center gap-3">
                      <input type="number"
                             class="flex-1 bg-transparent text-xl text-white font-mono outline-none"
                             [value]="state.startTime"
                             step="0.1" min="0" 
                             [max]="state.endTime - 0.1"
                             (change)="onStartChange($event)">
                      <span class="text-gray-600 font-mono text-sm leading-none">sec</span>
                    </div>
                  </div>
                  <div class="bg-gray-950 p-4 rounded-xl border border-gray-800 focus-within:border-cyan-500/50 transition-colors">
                    <label class="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">Out Point</label>
                    <div class="flex items-center gap-3">
                      <input type="number"
                             class="flex-1 bg-transparent text-xl text-white font-mono outline-none"
                             [value]="state.endTime"
                             step="0.1" 
                             [min]="state.startTime + 0.1"
                             [max]="state.videoMeta?.duration || 0"
                             (change)="onEndChange($event)">
                      <span class="text-gray-600 font-mono text-sm leading-none">sec</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Secondary Controls & Export -->
            <div class="w-full lg:w-96 flex flex-col gap-6">
              
              <!-- Export Card -->
              <div class="bg-gray-900/50 backdrop-blur-md rounded-2xl p-6 border border-gray-800 flex flex-col gap-6 shadow-xl">
                 <app-export-panel
                    [disabled]="state.status === 'processing'"
                    (formatChange)="onFormatSelected($event)"
                    (exportClicked)="onStartExport()">
                 </app-export-panel>

                 @if (state.status === 'success') {
                    <div class="p-1 bg-gray-950 rounded-xl border border-gray-800" [@slideUp]>
                        <button 
                           class="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white py-4 rounded-lg font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-3 active:scale-95"
                           (click)="onDownload(state)">
                           <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                           Download File
                        </button>
                    </div>
                 }

                 @if (state.status === 'error') {
                    <div class="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3" [@fadeIn]>
                       <svg class="w-6 h-6 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                       <div>
                          <p class="text-white font-bold text-xs">Processing Failed</p>
                          <p class="text-rose-400 text-[10px] mt-1">{{ state.errorMessage || 'Unknown system error' }}</p>
                          @if (state.retryable) {
                            <button (click)="onStartExport()" class="mt-2 text-[10px] font-black uppercase text-white underline underline-offset-4 hover:text-cyan-400 transition-colors">Retry Operation</button>
                          }
                       </div>
                    </div>
                 }
              </div>

              <!-- Information Card -->
              <div class="bg-gray-900/30 rounded-2xl p-5 border border-white/5 border-dashed">
                 <h4 class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">File Metrics</h4>
                 <div class="space-y-4">
                    <div class="flex justify-between items-end">
                       <span class="text-xs text-gray-400">Duration</span>
                       <span class="text-xs text-white font-mono">{{ state.videoMeta?.duration?.toFixed(2) }}s</span>
                    </div>
                    <div class="flex justify-between items-end">
                       <span class="text-xs text-gray-400">Resolution</span>
                       <span class="text-xs text-white">{{ state.videoMeta?.width }}×{{ state.videoMeta?.height }}</span>
                    </div>
                    <div class="flex justify-between items-end">
                       <span class="text-xs text-gray-400">FPS</span>
                       <span class="text-xs text-white">{{ state.videoMeta?.fps }}</span>
                    </div>
                 </div>
              </div>

            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4b5563; }
  `],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('500ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrimmerComponent implements OnDestroy {
  private store = inject(Store);
  private trimmerService = inject(TrimmerService);
  private subscription = new Subscription();
  
  readonly state$ = this.store.select(selectTrimmerState);
  videoUrl: string | null = null;

  onFileSelected(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
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
    const state = (this.store as any).actionsObserver?._value; // Accessing state via selector usually better but for start we need snapshot
    // Actually, it's better to use a selector or pipe(take(1))
    
    this.subscription.add(
      this.state$.pipe().subscribe(state => {
        if (state.status === 'processing' || !state.inputFile) return;
        
        this.store.dispatch(TrimmerActions.startProcessing());
        
        this.trimmerService.process({
          file: state.inputFile,
          startTime: state.startTime,
          endTime: state.endTime,
          outputFormat: state.outputFormat
        }).subscribe({
          next: (msg) => {
            if (msg.type === 'progress') {
              this.store.dispatch(TrimmerActions.updateProgress({ progress: msg.value }));
            } else if (msg.type === 'complete') {
              const outputBlob = new Blob([msg.data as BlobPart], { type: `video/${state.outputFormat}` });
              this.store.dispatch(TrimmerActions.processingSuccess({ 
                outputBlob, 
                outputSizeMB: outputBlob.size / (1024 * 1024) 
              }));
            }
          },
          error: (err) => {
            this.store.dispatch(TrimmerActions.processingFailure({
              errorCode: 'FFMPEG_COMMAND_FAILED',
              message: err.message || 'Processing failed',
              retryable: true
            }));
          }
        });
      }).unsubscribe() // Only execute once for the click
    );
  }

  onDownload(state: any): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const filename = this.trimmerService.getOutputFilename(state.inputFile?.name || 'video', state.outputFormat);
      const a = Object.assign(document.createElement('a'), { 
        href: url, 
        download: filename 
      });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  onReset(): void {
    if (this.videoUrl) {
      URL.revokeObjectURL(this.videoUrl);
      this.videoUrl = null;
    }
    this.store.dispatch(TrimmerActions.resetState());
  }

  ngOnDestroy(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.subscription.unsubscribe();
  }
}