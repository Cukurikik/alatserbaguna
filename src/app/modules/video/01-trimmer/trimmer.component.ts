import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { TrimmerActions, selectTrimmerState, TrimmerState } from './trimmer.store';
import { TrimmerService } from './trimmer.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { ExportPanelComponent } from '../shared/components/export-panel/export-panel.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription, take } from 'rxjs';

@Component({
  selector: 'app-trimmer',
  standalone: true,
  imports: [
    AsyncPipe, 
    DecimalPipe,
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
            Matrix Engine
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Precision Chronos Trimming: Frame-Exact Slicing v1.0</p>
        </div>
        @if (state$ | async; as state) {
          @if (state.inputFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-cyan-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-cyan-950/30 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </span>
              Dispose Asset
            </button>
          }
        }
      </div>

      @if (state$ | async; as state) {
        
        @if (!state.inputFile) {
          <div class="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full py-20 animate-in fade-in slide-in-from-bottom-8 duration-700" [@slideUp]>
            <app-file-drop-zone 
              accept="video/*" 
              (fileDropped)="onFileSelected($event)"
              class="w-full">
            </app-file-drop-zone>
            
            <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div class="p-8 rounded-[2rem] bg-gray-900/40 border border-gray-800 backdrop-blur-md group hover:border-cyan-500/30 transition-all duration-500">
                <div class="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                   <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <h4 class="text-white font-black text-sm uppercase tracking-tight">Zero Latency</h4>
                <p class="text-[10px] text-gray-500 mt-2 leading-relaxed font-medium uppercase tracking-widest opacity-60">Near-Instant cut sequences via WASM stream mapping.</p>
              </div>
              <div class="p-8 rounded-[2rem] bg-gray-900/40 border border-gray-800 backdrop-blur-md group hover:border-blue-500/30 transition-all duration-500">
                <div class="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
                   <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                </div>
                <h4 class="text-white font-black text-sm uppercase tracking-tight">Lossless Data</h4>
                <p class="text-[10px] text-gray-500 mt-2 leading-relaxed font-medium uppercase tracking-widest opacity-60">High-fidelity extraction without neural re-encoding.</p>
              </div>
              <div class="p-8 rounded-[2rem] bg-gray-900/40 border border-gray-800 backdrop-blur-md group hover:border-indigo-500/30 transition-all duration-500">
                <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                   <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>
                </div>
                <h4 class="text-white font-black text-sm uppercase tracking-tight">Deep OPFS</h4>
                <p class="text-[10px] text-gray-500 mt-2 leading-relaxed font-medium uppercase tracking-widest opacity-60">Direct kernel access to browser virtual filesystem.</p>
              </div>
            </div>
          </div>
        }

        @if (state.inputFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8 min-h-0" [@fadeIn]>
            
            <div class="flex-1 flex flex-col gap-8 min-h-0">
              <div class="relative group rounded-[2.5rem] overflow-hidden border border-gray-800 shadow-2xl bg-black/40 backdrop-blur-md">
                <app-video-preview 
                  [videoUrl]="videoUrl" 
                  (durationLoaded)="onDurationLoaded($event)">
                </app-video-preview>
                
                @if (state.status === 'processing') {
                   <div class="absolute inset-0 bg-gray-950/70 backdrop-blur-md flex flex-col items-center justify-center z-10" [@fadeIn]>
                      <app-progress-ring [progress]="state.progress" [status]="'TRIMMING_STREAM'"></app-progress-ring>
                      <div class="mt-8 flex flex-col items-center gap-2">
                         <span class="text-cyan-400 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse italic font-black">Running_Matrix_Ops</span>
                         <span class="text-gray-500 font-mono text-[8px] uppercase tracking-widest opacity-60">FFmpeg WASM v0.12.6</span>
                      </div>
                   </div>
                }
              </div>

              <!-- Control Center -->
              <div class="bg-gray-900/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-gray-800 shadow-2xl relative overflow-hidden">
                <div class="absolute top-0 right-0 p-4">
                   <span class="text-[10px] font-mono text-gray-600 uppercase tracking-[0.3em] italic">Temporal_Delta_Control</span>
                </div>

                <div class="flex items-center justify-between mb-8">
                  <h3 class="text-xl font-black text-white flex items-center gap-3 tracking-tighter uppercase italic">
                    <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758L5 19m0-14l5.758 5.758M12 12l2.879-2.879"/></svg>
                    Selection Matrix
                  </h3>
                  <div class="px-5 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl shadow-inner shadow-cyan-500/10">
                    <span class="text-xs font-mono text-cyan-400 font-black uppercase tracking-widest">
                       &Delta; {{ (state.endTime - state.startTime) | number:'1.2-2' }}s
                    </span>
                  </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div class="bg-black/40 p-6 rounded-[2rem] border border-gray-800 hover:border-cyan-500/30 focus-within:border-cyan-500 transition-all duration-300 shadow-lg">
                    <label class="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-3 italic opacity-60 leading-none">In_Point (T-Alpha)</label>
                    <div class="flex items-baseline gap-3">
                      <input type="number"
                             class="flex-1 bg-transparent text-3xl text-white font-black font-mono outline-none tracking-tighter"
                             [value]="state.startTime"
                             step="0.01" min="0" 
                             [max]="state.endTime - 0.01"
                             (change)="onStartChange($event)">
                      <span class="text-gray-600 font-mono text-xs font-bold uppercase tracking-widest">sec</span>
                    </div>
                  </div>
                  <div class="bg-black/40 p-6 rounded-[2rem] border border-gray-800 hover:border-cyan-500/30 focus-within:border-cyan-500 transition-all duration-300 shadow-lg">
                    <label class="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-3 italic opacity-60 leading-none">Out_Point (T-Omega)</label>
                    <div class="flex items-baseline gap-3">
                      <input type="number"
                             class="flex-1 bg-transparent text-3xl text-white font-black font-mono outline-none tracking-tighter"
                             [value]="state.endTime"
                             step="0.01" 
                             [min]="state.startTime + 0.01"
                             [max]="state.videoMeta?.duration || 0"
                             (change)="onEndChange($event)">
                      <span class="text-gray-600 font-mono text-xs font-bold uppercase tracking-widest">sec</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Side Intelligence -->
            <div class="w-full lg:w-[400px] flex flex-col gap-8">
              
              <!-- Export Command -->
              <div class="bg-gray-900/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-gray-800 flex flex-col gap-8 shadow-2xl relative overflow-hidden">
                 <div class="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
                 
                 <app-export-panel
                    [disabled]="state.status === 'processing'"
                    (formatChange)="onFormatSelected($event)"
                    (exportClicked)="onStartExport()">
                 </app-export-panel>

                 @if (state.status === 'success' && state.outputBlob) {
                    <div class="animate-in fade-in slide-in-from-top-4 duration-500">
                        <button 
                           class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 group"
                           (click)="onDownload(state)">
                           <svg class="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                           Download Transcoded Asset
                        </button>
                    </div>
                 }

                 @if (state.status === 'error') {
                    <div class="p-6 bg-rose-500/10 border border-rose-500/20 rounded-[1.5rem] flex items-start gap-4 animate-in shake-1 duration-500">
                       <div class="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                       </div>
                       <div class="flex-1 min-w-0">
                          <p class="text-white font-black text-xs uppercase tracking-tight">Kernel_Panic_Error</p>
                          <p class="text-rose-400 text-[10px] font-medium leading-relaxed uppercase tracking-wider opacity-80 mt-1 line-clamp-2 italic">{{ state.errorMessage || 'Unknown temporal system error' }}</p>
                          @if (state.retryable) {
                            <button (click)="onStartExport()" class="mt-3 text-[10px] font-black uppercase text-emerald-400 hover:text-white transition-colors underline underline-offset-4 tracking-[0.1em]">Retry_Execution</button>
                          }
                       </div>
                    </div>
                 }
              </div>

              <!-- Stream Forensics -->
              <div class="bg-gray-900/20 rounded-[2rem] p-8 border border-white/5 border-dashed relative overflow-hidden group">
                 <div class="absolute top-0 right-0 p-4 opacity-20">
                    <svg class="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/></svg>
                 </div>
                 <h4 class="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-2 italic opacity-60">
                    <span class="w-1 h-1 rounded-full bg-cyan-500"></span> Asset_Forensics
                 </h4>
                 <div class="space-y-5 relative">
                    <div class="flex justify-between items-end border-b border-white/5 pb-2">
                       <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Duration</span>
                       <span class="text-xs text-white font-mono font-black italic">{{ state.videoMeta?.duration | number:'1.2-2' }}s</span>
                    </div>
                    <div class="flex justify-between items-end border-b border-white/5 pb-2">
                       <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Resolution</span>
                       <span class="text-xs text-white font-mono font-black italic">{{ state.videoMeta?.width }}×{{ state.videoMeta?.height }}</span>
                    </div>
                    <div class="flex justify-between items-end border-b border-white/5 pb-2">
                       <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Flow_Rate</span>
                       <span class="text-xs text-white font-mono font-black italic">{{ state.videoMeta?.fps | number:'1.0-2' }} FPS</span>
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
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
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
    this.state$.pipe(take(1)).subscribe(state => {
      if (state.status === 'processing' || !state.inputFile) return;
      
      this.store.dispatch(TrimmerActions.startProcessing());
      
      this.subscription.add(
        this.trimmerService.process({
          file: state.inputFile,
          startTime: state.startTime,
          endTime: state.endTime,
          outputFormat: state.outputFormat
        }).subscribe({
          next: (msg) => {
            if (msg.type === 'progress') {
              this.store.dispatch(TrimmerActions.updateProgress({ progress: msg.value ?? 0 }));
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
              message: err.message || 'Matrix extraction command failed at kernel level.',
              retryable: true
            }));
          }
        })
      );
    });
  }

  onDownload(state: TrimmerState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const filename = this.trimmerService.getOutputFilename(state.inputFile?.name || 'video', state.outputFormat);
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  onReset(): void {
    if (this.videoUrl) { URL.revokeObjectURL(this.videoUrl); this.videoUrl = null; }
    this.store.dispatch(TrimmerActions.resetState());
  }

  ngOnDestroy(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.subscription.unsubscribe();
  }
}