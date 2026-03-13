import { fadeIn, slideUp, slideInRight, popIn, staggerFade, buttonState } from '../../../shared/animations';
import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { CompressorActions, selectCompressorState, CompressorState } from './compressor.store';
import { CompressorService } from './compressor.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { Subscription } from 'rxjs';

const PRESETS = ['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'veryslow'];

@Component({
  selector: 'app-compressor',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Dense Engine
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Precision Bitrate Neutralizer: Quantum Squeeze v1.0</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.inputFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-emerald-400 transition-all uppercase tracking-tighter" [@popIn]>
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-emerald-950/30 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </span>
              Purge Payload
            </button>
          }
        }
      </div>

      @if (vm$ | async; as vm) {
        
        @if (!vm.inputFile) {
          <div class="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full py-20" [@slideUp]>
            <app-file-drop-zone 
              accept="video/*" 
              (fileDropped)="onFileSelected($event)"
              class="w-full">
            </app-file-drop-zone>
            
            <div class="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8" [@staggerFade]>
               <div class="p-8 rounded-[2.5rem] bg-gray-900/40 border border-gray-800 backdrop-blur-md flex items-start gap-6 group hover:border-emerald-500/30 transition-all duration-500">
                  <div class="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-xl shadow-emerald-500/5">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-black text-sm uppercase tracking-tight italic">Dynamic CRF Control</h4>
                    <p class="text-[10px] text-gray-500 mt-2 leading-relaxed font-medium uppercase tracking-widest opacity-60 italic">Constant Rate Factor ensures consistent visual parity while minimizing bitstream volume.</p>
                  </div>
               </div>
               <div class="p-8 rounded-[2.5rem] bg-gray-900/40 border border-gray-800 backdrop-blur-md flex items-start gap-6 group hover:border-cyan-500/30 transition-all duration-500">
                  <div class="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform shadow-xl shadow-cyan-500/5">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-black text-sm uppercase tracking-tight italic">Multi-Threaded Squeeze</h4>
                    <p class="text-[10px] text-gray-500 mt-2 leading-relaxed font-medium uppercase tracking-widest opacity-60 italic">CPU-Optimized presets balancing processing velocity and final extraction efficiency.</p>
                  </div>
               </div>
            </div>
          </div>
        }

        @if (vm.inputFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8 min-h-0" [@fadeIn]>
            
            <div class="flex-1 flex flex-col gap-8 min-h-0" [@staggerFade]>
              <div class="relative group rounded-[2.5rem] overflow-hidden border border-gray-800 shadow-2xl bg-black/40 backdrop-blur-md">
                <app-video-preview [videoUrl]="videoUrl" (durationLoaded)="onDurationLoaded($event)"></app-video-preview>
                
                @if (vm.status === 'processing') {
                   <div class="absolute inset-0 bg-gray-950/70 backdrop-blur-md flex flex-col items-center justify-center z-10" [@fadeIn]>
                      <app-progress-ring [progress]="vm.progress" [status]="'COMPRESSING_BITSTREAM'"></app-progress-ring>
                      <div class="mt-8 flex flex-col items-center gap-2">
                         <span class="text-emerald-400 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse italic font-black">Dense_Core_Active</span>
                         <span class="text-gray-500 font-mono text-[8px] uppercase tracking-widest opacity-60 italic">Neutralizing Payload Density...</span>
                      </div>
                   </div>
                }
              </div>

              <!-- Size Comparison Masterpiece Widget -->
              <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden relative group">
                 <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-10"></div>
                 <div class="flex items-center justify-between mb-10 relative">
                    <h3 class="text-xl font-black text-white flex items-center gap-4 italic uppercase tracking-tighter">
                       <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                       </div>
                       Mass Neutralization
                    </h3>
                    @if (vm.status === 'success' && vm.outputSizeMB) {
                       <div class="px-5 py-2 bg-emerald-500 border border-emerald-400 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)]" [@popIn]>
                          <span class="text-[10px] font-black text-emerald-950 uppercase tracking-widest italic leading-none">
                            {{ (((vm.originalSizeMB - vm.outputSizeMB) / vm.originalSizeMB) * 100) | number:'1.1-1' }}% Purged
                          </span>
                       </div>
                    }
                 </div>
                 
                 <div class="flex items-center justify-between gap-6 relative">
                    <div class="flex-1 p-8 rounded-[2rem] bg-black/40 border border-gray-800 text-center shadow-lg group-hover:border-emerald-500/10 transition-colors">
                       <span class="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 italic opacity-60">Source_Volume</span>
                       <span class="text-3xl font-mono text-gray-300 font-black tracking-tighter italic">{{ vm.originalSizeMB | number:'1.2-2' }}<span class="text-[12px] ml-2 opacity-40 uppercase">MB</span></span>
                    </div>
                    
                    <div class="shrink-0 w-16 h-16 rounded-3xl border border-gray-800 flex items-center justify-center bg-gray-900 shadow-2xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                       <svg class="w-8 h-8 text-gray-700 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                    </div>
 
                    <div class="flex-1 p-8 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/20 text-center shadow-lg group-hover:border-emerald-500/40 transition-colors">
                       <span class="block text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.2em] mb-3 italic opacity-60">Neutron_Volume</span>
                       <span class="text-3xl font-mono text-emerald-400 font-black tracking-tighter italic">
                          {{ vm.status === 'success' && vm.outputSizeMB ? (vm.outputSizeMB | number:'1.2-2') : '---' }}<span class="text-[12px] ml-2 opacity-40 uppercase">MB</span>
                       </span>
                    </div>
                 </div>
              </div>
            </div>

            <div class="w-full lg:w-[420px] shrink-0 flex flex-col gap-8" [@slideInRight]>
              
              <!-- Settings Card -->
              <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-[2.5rem] p-10 flex flex-col gap-10 shadow-2xl relative overflow-hidden">
                 <div class="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>
                 
                 <!-- CRF Slider -->
                 <div class="p-8 bg-black/40 rounded-[2rem] border border-gray-800 shadow-xl group hover:border-emerald-500/20 transition-colors duration-500">
                    <div class="flex justify-between items-center mb-6">
                       <label class="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] italic opacity-60">Quantum_Density (CRF)</label>
                       <div class="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl shadow-inner">
                          <span class="text-emerald-400 font-mono text-xs font-black leading-none italic">{{ vm.crf }}</span>
                       </div>
                    </div>
                    <input type="range" min="18" max="51" [value]="vm.crf" (input)="onSetCRF($event)"
                      class="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none transition-all">
                    <div class="flex justify-between mt-4">
                       <span class="text-[8px] font-black text-gray-600 uppercase tracking-widest italic opacity-40 leading-none">Lossless-ish</span>
                       <span class="text-[8px] font-black text-gray-600 uppercase tracking-widest italic opacity-40 leading-none">Maximum_Squeeze</span>
                    </div>
                 </div>

                 <!-- Preset Selection -->
                 <div class="space-y-4">
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] italic opacity-60">Encoding_Priority</label>
                    <div class="grid grid-cols-4 gap-2">
                      @for (preset of presets; track preset) {
                        <button (click)="onSetPreset(preset)"
                          [class]="vm.preset === preset
                            ? 'bg-emerald-500 text-emerald-950 font-black border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-105'
                            : 'bg-black/40 text-gray-500 hover:bg-gray-800 hover:text-white border border-gray-800/50 opacity-60 hover:opacity-100'"
                          class="py-3.5 px-1 rounded-xl text-[9px] font-black font-mono transition-all transform uppercase tracking-widest hover:scale-[1.05] active:scale-95 leading-none border">
                          {{ preset }}
                        </button>
                      }
                    </div>
                 </div>

                 <!-- Output Format -->
                 <div class="space-y-4">
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] italic opacity-60">Target_Wrapper</label>
                    <div class="bg-black/40 p-6 rounded-[2rem] border border-gray-800">
                       <div class="flex flex-col gap-6">
                         <div class="flex gap-2">
                            @for (fmt of ['mp4', 'webm', 'mov']; track fmt) {
                              <button (click)="onSetFormat(fmt)"
                                [class]="vm.outputFormat === fmt
                                  ? 'bg-emerald-500 text-emerald-950 font-black border-emerald-400 shadow-lg scale-105'
                                  : 'bg-black/40 text-gray-500 hover:bg-gray-800 border border-gray-800/50'"
                                class="flex-1 py-3 rounded-xl transform text-[10px] font-black uppercase tracking-widest transition-all border italic">
                                {{ fmt }}
                              </button>
                            }
                         </div>
                         <button (click)="onStartCompress(vm)"
                           [@buttonState]="vm.status"
                           [disabled]="vm.status === 'processing'"
                           class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white font-black py-5 rounded-2xl shadow-2xl shadow-emerald-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.25em] flex items-center justify-center gap-4 italic disabled:opacity-30 cursor-pointer">
                           <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                           {{ vm.status === 'processing' ? 'NEUTRALIZING...' : (vm.status === 'success' ? 'SQUEEZE COMPLETE' : (vm.status === 'error' ? 'ATTEMPT RETRY' : 'Energize Squeeze')) }}
                         </button>
                       </div>
                    </div>
                 </div>

                 <!-- Action Results -->
                 <div class="pt-6 border-t border-gray-800/50 overflow-hidden">
                    @if (vm.status === 'success') {
                       <button (click)="onDownload(vm)" 
                         class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 group italic" [@slideUp]>
                         <svg class="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                         Export Reconstructed Asset
                       </button>
                    }

                    @if (vm.status === 'error') {
                       <div class="p-6 bg-rose-500/5 border border-rose-500/20 rounded-[1.5rem] flex items-start gap-4" [@fadeIn]>
                          <div class="w-10 h-10 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 shrink-0 shadow-lg">
                             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                          </div>
                          <div class="flex-1 min-w-0">
                            <p class="text-white font-black text-xs uppercase tracking-tight italic">Engine_Squeeze_Failure</p>
                            <p class="text-rose-400 font-black font-mono text-[9px] mt-1.5 leading-relaxed uppercase tracking-wider opacity-80 italic line-clamp-2">{{ vm.errorMessage || 'Unknown bitstream reduction failure' }}</p>
                            @if (vm.retryable) {
                               <button (click)="onStartCompress(vm)" class="mt-4 text-[9px] font-black uppercase text-white border-b-2 border-white/10 hover:border-emerald-500 transition-all hover:text-emerald-400 tracking-[0.2em] italic">Retry_Attempt_Ops</button>
                            }
                          </div>
                       </div>
                    }
                 </div>
              </div>

              <!-- Technical Stats -->
              <div class="bg-gray-900/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-gray-800 shadow-inner group hover:border-emerald-500/10 transition-colors">
                 <h4 class="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] mb-6 italic opacity-60">Stream_Diagnostics</h4>
                 <div class="space-y-4">
                    <div class="flex justify-between items-center text-[10px] font-mono">
                       <span class="text-gray-500 uppercase tracking-widest italic opacity-60">Resolution</span>
                       <span class="text-white font-black italic">{{ vm.videoMeta?.width || '–' }}×{{ vm.videoMeta?.height || '–' }}</span>
                    </div>
                    <div class="flex justify-between items-center text-[10px] font-mono">
                       <span class="text-gray-500 uppercase tracking-widest italic opacity-60">Frequency</span>
                       <span class="text-white font-black italic">{{ vm.videoMeta?.fps || '–' }} Hz</span>
                    </div>
                    <div class="flex justify-between items-center text-[10px] font-mono">
                       <span class="text-gray-500 uppercase tracking-widest italic opacity-60">Codec_Logic</span>
                       <span class="text-emerald-400 font-black italic uppercase">{{ vm.videoMeta?.codec || 'AUTO' }}</span>
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
  animations: [fadeIn, slideUp, slideInRight, popIn, staggerFade, buttonState],
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
            message: err.message ?? 'Compression failed. Neural bitstream diverging.',
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
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
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