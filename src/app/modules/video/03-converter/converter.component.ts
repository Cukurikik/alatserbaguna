import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { ConverterActions, selectConverterState, ConverterState } from './converter.store';
import { ConverterService } from './converter.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

const RESOLUTIONS = ['original', '4K (2160p)', '1080p', '720p', '480p', '360p'];
const FORMATS = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'gif'];

@Component({
  selector: 'app-converter',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Video Converter
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Multi-format Transcoding Engine</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.inputFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-rose-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-rose-950/30 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </span>
              Reset
            </button>
          }
        }
      </div>

      @if (vm$ | async; as vm) {
        
        <!-- Pillar 5: I/O — Input State -->
        @if (!vm.inputFile) {
          <div class="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full" [@slideUp]>
            <app-file-drop-zone 
              accept="video/*" 
              (fileDropped)="onFileSelected($event)">
            </app-file-drop-zone>
            
            <div class="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
               <div class="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Universal Transcoding</h4>
                    <p class="text-xs text-gray-500 mt-1">Convert between MP4, WebM, MOV, and AVI with professional-grade CRF quality settings.</p>
                  </div>
               </div>
               <div class="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">WebGPU Acceleration</h4>
                    <p class="text-xs text-gray-500 mt-1">Optimized rendering pipeline for faster exports on compatible hardware.</p>
                  </div>
               </div>
            </div>
          </div>
        }

        <!-- Pillar 4: Component Logic Area -->
        @if (vm.inputFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8" [@fadeIn]>
            
            <!-- Left: Video & Meta -->
            <div class="flex-1 flex flex-col gap-6">
              <div class="relative group rounded-3xl overflow-hidden border border-gray-800 shadow-2xl bg-black/40">
                <app-video-preview [videoUrl]="videoUrl" (durationLoaded)="onDurationLoaded($event)"></app-video-preview>
                
                @if (vm.status === 'processing') {
                   <div class="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-10" [@fadeIn]>
                      <app-progress-ring [progress]="vm.progress" [status]="'TRANSCODING'"></app-progress-ring>
                      <p class="text-orange-400 font-mono text-[10px] mt-6 uppercase tracking-[0.4em] animate-pulse">FFMPEG THREAD RUNNING</p>
                   </div>
                }
              </div>

              <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-xl">
                 <div class="flex items-center gap-4 mb-6">
                    <div class="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-400">
                       <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </div>
                    <div>
                      <h4 class="text-white font-black text-sm uppercase tracking-tight">Source Manifest</h4>
                      <p class="text-gray-500 font-mono text-[10px] uppercase truncate max-w-[200px]">{{ vm.inputFile.name }}</p>
                    </div>
                 </div>
                 
                 <div class="grid grid-cols-3 gap-4">
                    <div class="bg-black/20 p-4 rounded-2xl border border-gray-800/50">
                       <span class="block text-[9px] font-black text-gray-600 uppercase mb-1">Dimensions</span>
                       <span class="text-white font-mono text-sm tracking-tighter">{{ vm.videoMeta?.width || '–' }}×{{ vm.videoMeta?.height || '–' }}</span>
                    </div>
                    <div class="bg-black/20 p-4 rounded-2xl border border-gray-800/50">
                       <span class="block text-[9px] font-black text-gray-600 uppercase mb-1">Duration</span>
                       <span class="text-white font-mono text-sm tracking-tighter">{{ vm.videoMeta?.duration?.toFixed(2) || '–' }}s</span>
                    </div>
                    <div class="bg-black/20 p-4 rounded-2xl border border-gray-800/50">
                       <span class="block text-[9px] font-black text-gray-600 uppercase mb-1">Filesize</span>
                       <span class="text-white font-mono text-sm tracking-tighter">{{ (vm.inputFile.size / (1024*1024)).toFixed(2) }} MB</span>
                    </div>
                 </div>
              </div>
            </div>

            <!-- Right: Settings Panel -->
            <div class="w-full lg:w-[420px] flex flex-col gap-6">
              
              <!-- Conversion Settings -->
              <div class="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 flex flex-col gap-8 shadow-2xl">
                 
                 <!-- Output Format Selection -->
                 <div>
                   <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Target Matrix</label>
                   <div class="grid grid-cols-3 gap-2">
                     @for (fmt of formats; track fmt) {
                       <button (click)="onSetFormat(fmt)"
                         [class]="vm.outputFormat === fmt
                           ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 ring-2 ring-orange-500/20'
                           : 'bg-black/40 text-gray-500 hover:bg-gray-800 hover:text-white border border-gray-800'"
                         class="py-3 px-2 rounded-xl text-[10px] font-black font-mono transition-all uppercase tracking-widest hover:scale-[1.02] active:scale-95 leading-none">
                         {{ fmt }}
                       </button>
                     }
                   </div>
                 </div>

                 <!-- Resolution Selection -->
                 <div>
                   <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Spatial Scale</label>
                   <div class="relative group">
                      <select class="w-full bg-black/40 border border-gray-800 text-white rounded-2xl px-6 py-4 font-mono text-xs focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 outline-none appearance-none cursor-pointer transition-all hover:bg-black/60"
                        (change)="onSetResolution($event)">
                        @for (res of resolutions; track res) {
                          <option [value]="res">{{ res }}</option>
                        }
                      </select>
                      <div class="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600 group-hover:text-orange-400 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                      </div>
                   </div>
                 </div>

                 <!-- CRF Slider -->
                 <div class="p-6 bg-black/30 rounded-2xl border border-gray-800/50">
                    <div class="flex justify-between items-center mb-5">
                      <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest">Quality Density (CRF)</label>
                      <span class="px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded-md text-orange-400 font-mono text-xs font-bold leading-none">{{ vm.crf }}</span>
                    </div>
                    <input type="range" min="1" max="51" [value]="vm.crf" (input)="onSetCRF($event)"
                      class="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500 focus:outline-none">
                    <div class="flex justify-between mt-3">
                      <span class="text-[9px] font-bold text-gray-600 uppercase tracking-tighter">Hyper Quant</span>
                      <span class="text-[9px] font-bold text-gray-600 uppercase tracking-tighter">Compressed</span>
                    </div>
                 </div>

                 <!-- Action Button -->
                 <div class="pt-4 border-t border-gray-800/50">
                    @if (vm.status === 'idle' || vm.status === 'error') {
                       <button (click)="onConvert(vm)"
                         class="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                         Start Transcoding
                       </button>
                    } @else if (vm.status === 'success') {
                       <div class="space-y-3" [@slideUp]>
                          <button (click)="onDownload(vm)" 
                            class="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2x; font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Export Results
                          </button>
                          @if (vm.outputSizeMB) {
                            <p class="text-center text-[9px] font-mono text-gray-500 uppercase tracking-widest">Rendered Size: {{ vm.outputSizeMB.toFixed(2) }} MB</p>
                          }
                       </div>
                    } @else {
                       <div class="h-14 w-full bg-gray-800/20 rounded-2xl flex items-center justify-center border border-dashed border-gray-800 opacity-50">
                          <span class="text-[10px] font-mono text-gray-600 uppercase tracking-widest animate-pulse">Initializing Engine...</span>
                       </div>
                    }

                    @if (vm.status === 'error') {
                       <div class="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4" [@fadeIn]>
                          <svg class="w-5 h-5 text-rose-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                          <div>
                            <p class="text-white font-black text-xs uppercase leading-tight">Error</p>
                            <p class="text-rose-400 font-mono text-[9px] mt-1 leading-relaxed">{{ vm.errorMessage || 'Transcode failure' }}</p>
                            @if (vm.retryable) {
                              <button (click)="onConvert(vm)" class="mt-3 text-[9px] font-black uppercase text-white border-b border-white/20 hover:text-orange-400 transition-colors">Retry Attempt</button>
                            }
                          </div>
                       </div>
                    }
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
export class ConverterComponent implements OnDestroy {
  private store = inject(Store);
  private converterService = inject(ConverterService);
  private subscription = new Subscription();
  
  readonly vm$ = this.store.select(selectConverterState);
  videoUrl: string | null = null;
  readonly formats = FORMATS;
  readonly resolutions = RESOLUTIONS;

  onFileSelected(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(ConverterActions.loadFile({ file }));
  }

  onDurationLoaded(duration: number): void {
    this.store.dispatch(ConverterActions.loadMetaSuccess({
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

  onSetFormat(format: string): void { this.store.dispatch(ConverterActions.setOutputFormat({ format })); }
  onSetResolution(e: Event): void { this.store.dispatch(ConverterActions.setResolution({ resolution: (e.target as HTMLSelectElement).value })); }
  onSetCRF(e: Event): void { this.store.dispatch(ConverterActions.setCRF({ crf: parseInt((e.target as HTMLInputElement).value) })); }

  onConvert(state: ConverterState): void {
    if (!state.inputFile) return;
    
    this.store.dispatch(ConverterActions.startProcessing());
    
    this.subscription.add(
      this.converterService.process({
        file: state.inputFile,
        outputFormat: state.outputFormat,
        resolution: state.resolution,
        crf: state.crf
      }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') {
            this.store.dispatch(ConverterActions.updateProgress({ progress: msg.value ?? 0 }));
          } else if (msg.type === 'complete') {
            const blob = new Blob([msg.data as BlobPart], { type: `video/${state.outputFormat}` });
            this.store.dispatch(ConverterActions.processingSuccess({ 
              outputBlob: blob,
              outputSizeMB: blob.size / (1024 * 1024)
            }));
          }
        },
        error: (err) => {
          this.store.dispatch(ConverterActions.processingFailure({ 
            errorCode: 'FFMPEG_COMMAND_FAILED', 
            message: err.message ?? 'Conversion unsuccessful. Target codec might be restricted.',
            retryable: true
          }));
        }
      })
    );
  }

  onDownload(state: ConverterState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const filename = this.converterService.getOutputFilename(state.inputFile?.name || 'video', state.outputFormat);
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
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = null;
    this.store.dispatch(ConverterActions.resetState());
  }

  ngOnDestroy(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.subscription.unsubscribe();
  }
}