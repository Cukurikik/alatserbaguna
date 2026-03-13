import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { CompressorActions, selectCompressorState, CompressorState } from './compressor.store';
import { CompressorService } from './compressor.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

const PRESETS = ['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'veryslow'];

@Component({
  selector: 'app-compressor',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Video Compressor
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Precision Bitrate Neutralizer</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.inputFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-rose-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-rose-950/30 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </span>
              Clear
            </button>
          }
        }
      </div>

      @if (vm$ | async; as vm) {
        
        <!-- Pillar 5: I/O — Input State -->
        @if (!vm.inputFile) {
          <div class="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full" [@slideUp]>
            <app-file-drop-zone accept="video/*" (fileDropped)="onFileSelected($event)"></app-file-drop-zone>
            
            <div class="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
               <div class="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Dynamic CRF Control</h4>
                    <p class="text-xs text-gray-500 mt-1">Constant Rate Factor ensures consistent visual quality across every frame while minimizing file weight.</p>
                  </div>
               </div>
               <div class="p-6 rounded-2xl bg-teal-500/5 border border-teal-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Multi-Threaded Encoding</h4>
                    <p class="text-xs text-gray-500 mt-1">CPU-Optimized presets (Ultrafast to Veryslow) to balance processing speed and final efficiency.</p>
                  </div>
               </div>
            </div>
          </div>
        }

        <!-- Pillar 4: Component Logic Area -->
        @if (vm.inputFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8" [@fadeIn]>
            
            <!-- Left: Preview & Metrics -->
            <div class="flex-1 flex flex-col gap-6">
              <div class="relative group rounded-3xl overflow-hidden border border-gray-800 shadow-2xl bg-black/40">
                <app-video-preview [videoUrl]="videoUrl" (durationLoaded)="onDurationLoaded($event)"></app-video-preview>
                
                @if (vm.status === 'processing') {
                   <div class="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-10" [@fadeIn]>
                      <app-progress-ring [progress]="vm.progress" [status]="'REDUCING'"></app-progress-ring>
                      <p class="text-emerald-400 font-mono text-[10px] mt-6 uppercase tracking-[0.4em] animate-pulse">Encoding Pipeline Saturated</p>
                   </div>
                }
              </div>

              <!-- Size Comparison Masterpiece Widget -->
              <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-xl overflow-hidden relative group">
                 <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <div class="flex items-center justify-between mb-8 relative">
                    <h3 class="text-lg font-black text-white flex items-center gap-3">
                       <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                       Mass Reduction
                    </h3>
                    @if (vm.status === 'success' && vm.outputSizeMB) {
                       <div class="px-4 py-1.5 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/20">
                          <span class="text-xs font-black text-emerald-950 uppercase tracking-tighter">
                            {{ (((vm.originalSizeMB - vm.outputSizeMB) / vm.originalSizeMB) * 100).toFixed(1) }}% Saved
                          </span>
                       </div>
                    }
                 </div>
                 
                 <div class="flex items-center justify-between gap-4 relative">
                    <div class="flex-1 p-6 rounded-2xl bg-black/20 border border-gray-800 text-center">
                       <span class="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Original Volume</span>
                       <span class="text-2xl font-mono text-gray-300 font-black tracking-tighter">{{ vm.originalSizeMB.toFixed(2) }}<span class="text-[10px] ml-1 opacity-40">MB</span></span>
                    </div>
                    
                    <div class="shrink-0 w-12 h-12 rounded-full border border-gray-800 flex items-center justify-center bg-gray-900">
                       <svg class="w-6 h-6 text-gray-700 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                    </div>

                    <div class="flex-1 p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                       <span class="block text-[9px] font-black text-emerald-500/60 uppercase tracking-widest mb-2">Compressed Volume</span>
                       <span class="text-2xl font-mono text-emerald-400 font-black tracking-tighter">
                          {{ vm.status === 'success' && vm.outputSizeMB ? vm.outputSizeMB.toFixed(2) : '---' }}<span class="text-[10px] ml-1 opacity-40">MB</span>
                       </span>
                    </div>
                 </div>
              </div>
            </div>

            <!-- Right: Parameters Panel -->
            <div class="w-full lg:w-[420px] flex flex-col gap-6">
              
              <!-- Settings Card -->
              <div class="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 flex flex-col gap-8 shadow-2xl">
                 
                 <!-- CRF Slider -->
                 <div class="p-6 bg-black/30 rounded-2xl border border-gray-800/50 relative overflow-hidden">
                    <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                    <div class="flex justify-between items-center mb-6">
                      <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Quantum Density (CRF)</label>
                      <div class="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                         <span class="text-emerald-400 font-mono text-xs font-bold leading-none">{{ vm.crf }}</span>
                      </div>
                    </div>
                    <input type="range" min="18" max="51" [value]="vm.crf" (input)="onSetCRF($event)"
                      class="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none">
                    <div class="flex justify-between mt-4">
                      <span class="text-[9px] font-bold text-gray-600 uppercase tracking-tighter">Lossless-ish</span>
                      <span class="text-[9px] font-bold text-gray-600 uppercase tracking-tighter">Maximum Squeeze</span>
                    </div>
                 </div>

                 <!-- Preset Selection -->
                 <div>
                   <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Encoding Priority</label>
                   <div class="grid grid-cols-4 gap-2">
                     @for (preset of presets; track preset) {
                       <button (click)="onSetPreset(preset)"
                         [class]="vm.preset === preset
                           ? 'bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/20'
                           : 'bg-black/40 text-gray-500 hover:bg-gray-800 hover:text-white border border-gray-800'"
                         class="py-3 px-1 rounded-xl text-[9px] font-black font-mono transition-all uppercase tracking-widest hover:scale-[1.05] active:scale-95 leading-none">
                         {{ preset }}
                       </button>
                     }
                   </div>
                   <p class="text-[9px] text-gray-600 mt-4 font-mono uppercase tracking-tighter">* Slower presets result in better compression ratios.</p>
                 </div>

                 <!-- Output Format -->
                 <div class="flex flex-col gap-4">
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Target Wrapper</label>
                    <app-export-panel
                       [disabled]="vm.status === 'processing'"
                       (formatChange)="onSetFormat($event)"
                       (exportClicked)="onStartCompress(vm)">
                    </app-export-panel>
                 </div>

                 <!-- Success/Error Logic -->
                 <div class="pt-4 border-t border-gray-800/50">
                    @if (vm.status === 'success') {
                       <button (click)="onDownload(vm)" 
                         class="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95" [@slideUp]>
                         <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                         Export Compressed Asset
                       </button>
                    }

                    @if (vm.status === 'error') {
                       <div class="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4" [@fadeIn]>
                          <svg class="w-5 h-5 text-rose-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                          <div class="flex-1">
                            <p class="text-white font-black text-xs uppercase leading-tight tracking-tight">Neutron Engine Core Error</p>
                            <p class="text-rose-400 font-mono text-[9px] mt-1 pr-2 leading-relaxed opacity-80">{{ vm.errorMessage || 'Unknown system divergence' }}</p>
                            @if (vm.retryable) {
                               <button (click)="onStartCompress(vm)" class="mt-4 text-[10px] font-black uppercase text-white bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-full border border-white/10 transition-all">Re-initialize</button>
                            }
                          </div>
                       </div>
                    }
                 </div>
              </div>

              <!-- Extra Technical Metadata -->
              <div class="bg-gray-900/30 rounded-3xl p-6 border border-white/5 border-dashed">
                 <h4 class="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-4">Stream Diagnostics</h4>
                 <div class="space-y-3">
                    <div class="flex justify-between items-center text-[10px] font-mono">
                       <span class="text-gray-500 uppercase tracking-tighter">Spatial Resolution</span>
                       <span class="text-white">{{ vm.videoMeta?.width || '–' }}×{{ vm.videoMeta?.height || '–' }}</span>
                    </div>
                    <div class="flex justify-between items-center text-[10px] font-mono">
                       <span class="text-gray-500 uppercase tracking-tighter">Interframe Speed</span>
                       <span class="text-white font-bold">{{ vm.videoMeta?.fps || '–' }} Hz</span>
                    </div>
                    <div class="flex justify-between items-center text-[10px] font-mono">
                       <span class="text-gray-500 uppercase tracking-tighter">Encoding Logic</span>
                       <span class="text-white uppercase">{{ vm.videoMeta?.codec || 'AUTO' }}</span>
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
export class CompressorComponent implements OnDestroy {
  private store = inject(Store);
  private compressorService = inject(CompressorService);
  private subscription = new Subscription();
  
  readonly vm$ = this.store.select(selectCompressorState);
  videoUrl: string | null = null;
  readonly presets = PRESETS;

  onFileSelected(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(CompressorActions.loadFile({ file }));
  }

  onDurationLoaded(duration: number): void {
    this.store.dispatch(CompressorActions.loadMetaSuccess({
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

  onSetFormat(format: string): void { this.store.dispatch(CompressorActions.setOutputFormat({ format })); }
  onSetPreset(preset: string): void { this.store.dispatch(CompressorActions.setPreset({ preset })); }
  onSetCRF(e: Event): void { this.store.dispatch(CompressorActions.setCRF({ crf: parseInt((e.target as HTMLInputElement).value) })); }

  onStartCompress(state: CompressorState): void {
    if (!state.inputFile) return;
    
    this.store.dispatch(CompressorActions.startProcessing());
    
    this.subscription.add(
      this.compressorService.process({
        file: state.inputFile,
        outputFormat: state.outputFormat,
        crf: state.crf,
        preset: state.preset
      }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') {
            this.store.dispatch(CompressorActions.updateProgress({ progress: msg.value ?? 0 }));
          } else if (msg.type === 'complete') {
            const blob = new Blob([msg.data as BlobPart], { type: `video/${state.outputFormat}` });
            this.store.dispatch(CompressorActions.processingSuccess({ 
              outputBlob: blob,
              outputSizeMB: blob.size / (1024 * 1024)
            }));
          }
        },
        error: (err) => {
          this.store.dispatch(CompressorActions.processingFailure({ 
            errorCode: 'FFMPEG_COMMAND_FAILED', 
            message: err.message ?? 'Compression failed. Try a faster preset or moderate quality.',
            retryable: true
          }));
        }
      })
    );
  }

  onDownload(state: CompressorState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const filename = this.compressorService.getOutputFilename(state.inputFile?.name || 'video', state.outputFormat, state.crf);
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
    this.store.dispatch(CompressorActions.resetState());
  }

  ngOnDestroy(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.subscription.unsubscribe();
  }
}