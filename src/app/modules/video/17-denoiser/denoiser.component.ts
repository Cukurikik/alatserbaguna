import { fadeIn, slideUp, slideInRight, popIn, staggerFade, buttonState } from '../../../shared/animations';
import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { DenoiserActions, selectDenoiserState, DenoiserState, DenoiseAlgorithm } from './denoiser.store';
import { DenoiserService } from './denoiser.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-denoiser',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-blue-400 via-sky-500 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Silence Engine
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Spectral Subtraction: Signal Purification v1.0</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.inputFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-sky-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-sky-950/30 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </span>
              Dispose
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
               <div class="p-6 rounded-2xl bg-sky-500/5 border border-sky-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a2 2 0 00-1.96 1.414l-.722 2.528a2 2 0 00.323 1.815l.844.844a2 2 0 001.414.586h.5a2 2 0 001.414-.586l.844-.844a2 2 0 00.323-1.815l-.722-2.528z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Signal Purification</h4>
                    <p class="text-xs text-gray-500 mt-1">High-fidelity frequency analysis to isolate and remove transient noise artifacts. HQDN3D & NLMeans optimized.</p>
                  </div>
               </div>
               <div class="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Audio De-Noiser</h4>
                    <p class="text-xs text-gray-500 mt-1">AFFTDN spectral profile reduction for audio streams. Eliminates background hums and static interference.</p>
                  </div>
               </div>
            </div>
          </div>
        }

        <!-- Pillar 4: Component Logic Area -->
        @if (vm.inputFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8" [@fadeIn]>
            
            <!-- Left: Preview & Purification Visuals -->
            <div class="flex-1 flex flex-col gap-6">
              <div class="relative group rounded-3xl overflow-hidden border border-gray-800 shadow-2xl bg-black/40 aspect-video flex-col flex items-center justify-center">
                <app-video-preview [videoUrl]="videoUrl" (durationLoaded)="onDurationLoaded($event)"></app-video-preview>
                
                @if (vm.status === 'processing') {
                   <div class="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-10" [@fadeIn]>
                      <app-progress-ring [progress]="vm.progress" [status]="'PURIFYING'"></app-progress-ring>
                      <div class="mt-6 flex flex-col items-center gap-2 text-center px-6">
                         <p class="text-sky-400 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse font-black">Scanning Frequency Domain</p>
                         <p class="text-gray-500 font-mono text-[8px] uppercase">Reconstructing Spatial Consistency Map</p>
                      </div>
                   </div>
                }

                <div class="absolute top-4 right-4 px-3 py-1 bg-sky-500/20 border border-sky-500/40 rounded-lg backdrop-blur-md flex items-center gap-2">
                   <div class="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></div>
                   <span class="text-[9px] font-black text-sky-400 uppercase tracking-widest">Silence-Input v1.0</span>
                </div>
              </div>

              <!-- Stream Dashboard -->
              <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                 <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 font-mono">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Source Stream</span>
                       <span class="text-white text-xs truncate uppercase tracking-tighter">{{ vm.videoMeta?.codec || 'AUTO' }} // {{ vm.videoMeta?.width }}x{{ vm.videoMeta?.height }}</span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono">
                       <span class="text-[9px] font-black text-sky-500/60 uppercase tracking-widest leading-none mb-1">Denoise Logic</span>
                       <span class="text-sky-400 text-xs font-black truncate uppercase">
                          {{ vm.algorithm }}
                       </span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Audio State</span>
                       <span class="text-white text-[10px] uppercase font-black">
                          {{ vm.denoiseAudio ? 'ACTIVE' : 'BYPASS' }}
                       </span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pl-4 font-mono">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Kernel Hash</span>
                       <span class="text-gray-400 text-[10px] tracking-tighter">purify_engine_v0.1</span>
                    </div>
                 </div>
                 <div class="absolute inset-0 bg-gradient-to-r from-sky-500/5 via-transparent to-transparent"></div>
              </div>
            </div>

            <!-- Right: Parameters Panel -->
            <div class="w-full lg:w-[420px] flex flex-col gap-6">
              
              <!-- Parameters Card -->
              <div class="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
                 
                 <!-- Algorithm Matrix -->
                 <div>
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 leading-none italic opacity-60">Purification Logic</label>
                    <div class="grid grid-cols-1 gap-2">
                       <button (click)="onSetAlgorithm('hqdn3d')" [class]="vm.algorithm === 'hqdn3d' ? 'bg-sky-500 text-sky-950 font-black border-sky-400' : 'bg-black/40 text-gray-500 hover:text-white border-gray-800'"
                         class="p-4 rounded-xl text-[10px] uppercase font-black transition-all border flex flex-col items-start gap-1">
                          <span>HQDN3D</span>
                          <span class="text-[8px] opacity-60 font-medium">Standard spatial-temporal denoiser. Fast.</span>
                       </button>
                       <button (click)="onSetAlgorithm('nlmeans')" [class]="vm.algorithm === 'nlmeans' ? 'bg-sky-500 text-sky-950 font-black border-sky-400' : 'bg-black/40 text-gray-500 hover:text-white border-gray-800'"
                         class="p-4 rounded-xl text-[10px] uppercase font-black transition-all border flex flex-col items-start gap-1">
                          <span>NL-MEANS (Pro)</span>
                          <span class="text-[8px] opacity-60 font-medium tracking-tight">Non-local means purification. CPU Intensive.</span>
                       </button>
                       <button (click)="onSetAlgorithm('atadenoise')" [class]="vm.algorithm === 'atadenoise' ? 'bg-sky-500 text-sky-950 font-black border-sky-400' : 'bg-black/40 text-gray-500 hover:text-white border-gray-800'"
                         class="p-4 rounded-xl text-[10px] uppercase font-black transition-all border flex flex-col items-start gap-1">
                          <span>ATADENOISE</span>
                          <span class="text-[8px] opacity-60 font-medium">Adaptive temporal-averaging logic. High stability.</span>
                       </button>
                    </div>
                 </div>

                 <!-- Strength Matrices -->
                 <div class="grid grid-cols-2 gap-4">
                    <div class="p-4 bg-black/40 rounded-2xl border border-gray-800">
                       <div class="flex justify-between items-center mb-3">
                          <label class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none">Luma Purge</label>
                          <span class="text-[9px] font-mono text-sky-400 font-black">{{ vm.lumaStrength }}</span>
                       </div>
                       <input type="range" min="1" max="20" step="1" [value]="vm.lumaStrength" (input)="onSetLuma($event)"
                         class="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-sky-500">
                    </div>
                    <div class="p-4 bg-black/40 rounded-2xl border border-gray-800">
                       <div class="flex justify-between items-center mb-3">
                          <label class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none">Chroma Purge</label>
                          <span class="text-[9px] font-mono text-sky-400 font-black">{{ vm.chromaStrength }}</span>
                       </div>
                       <input type="range" min="1" max="20" step="1" [value]="vm.chromaStrength" (input)="onSetChroma($event)"
                         class="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-sky-500">
                    </div>
                 </div>

                 <!-- Audio Denoise Bridge -->
                 <div (click)="onToggleAudio()" [class]="vm.denoiseAudio ? 'bg-sky-500/10 border-sky-500/30' : 'bg-black/40 border-gray-800'"
                    class="p-4 rounded-2xl border flex items-center justify-between group cursor-pointer transition-all">
                    <div class="flex items-center gap-3">
                       <div [class]="vm.denoiseAudio ? 'bg-sky-500 text-sky-950' : 'bg-gray-800 text-gray-500'" class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
                       </div>
                       <span [class]="vm.denoiseAudio ? 'text-white' : 'text-gray-500'" class="text-[10px] font-black uppercase tracking-widest">Audio Purification</span>
                    </div>
                    <div [class]="vm.denoiseAudio ? 'bg-sky-500' : 'bg-gray-800'" class="w-10 h-5 rounded-full relative transition-colors shadow-inner">
                       <div [class]="vm.denoiseAudio ? 'translate-x-5' : 'translate-x-1'" class="absolute top-1 w-3 h-3 bg-white rounded-full transition-transform"></div>
                    </div>
                 </div>

                 <!-- Action Area -->
                 <div class="pt-4 border-t border-gray-800/50">
                    @if (vm.status === 'idle' || vm.status === 'error') {
                       <button (click)="onPurify(vm)"
                         class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-black py-4 rounded-2xl shadow-xl shadow-sky-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                         Start Purge
                       </button>
                    } @else if (vm.status === 'success') {
                       <div class="space-y-3" [@slideUp]>
                          <button (click)="onDownload(vm)" 
                            class="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Export Pure
                          </button>
                          @if (vm.outputSizeMB) {
                            <p class="text-center text-[9px] font-mono text-gray-500 uppercase tracking-widest">Purified Volume: {{ vm.outputSizeMB.toFixed(2) }} MB</p>
                          }
                       </div>
                    } @else {
                       <div class="h-14 w-full bg-gray-800/20 rounded-2xl flex items-center justify-center border border-dashed border-gray-800 opacity-50">
                          <span class="text-[10px] font-mono text-gray-600 uppercase tracking-widest animate-pulse">Filtering Signal Noise...</span>
                       </div>
                    }

                    @if (vm.status === 'error') {
                       <div class="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4" [@fadeIn]>
                          <svg class="w-5 h-5 text-rose-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                          <div class="flex-1">
                            <p class="text-white font-black text-xs uppercase tracking-tight">Kernel Panic</p>
                            <p class="text-rose-400 font-mono text-[9px] mt-1 pr-2 leading-relaxed opacity-80">{{ vm.errorMessage || 'Unknown purify rejection' }}</p>
                            @if (vm.retryable) {
                               <button (click)="onPurify(vm)" class="mt-4 text-[10px] font-black uppercase text-white bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-full border border-white/10 transition-all">Restart Purge</button>
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
export class DenoiserComponent implements OnDestroy {
  private store = inject(Store);
  private purifyService = inject(DenoiserService);
  private subscription = new Subscription();
  
  readonly vm$ = this.store.select(selectDenoiserState);
  videoUrl: string | null = null;

  onFileSelected(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(DenoiserActions.loadFile({ file }));
  }

  onDurationLoaded(duration: number): void {
    this.store.dispatch(DenoiserActions.loadMetaSuccess({
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

  onSetAlgorithm(algorithm: DenoiseAlgorithm): void { this.store.dispatch(DenoiserActions.setAlgorithm({ algorithm })); }
  onSetLuma(e: Event): void { this.store.dispatch(DenoiserActions.setLumaStrength({ strength: parseInt((e.target as HTMLInputElement).value, 10) })); }
  onSetChroma(e: Event): void { this.store.dispatch(DenoiserActions.setChromaStrength({ strength: parseInt((e.target as HTMLInputElement).value, 10) })); }
  onToggleAudio(): void { this.store.dispatch(DenoiserActions.toggleDenoiseAudio()); }

  onPurify(state: DenoiserState): void {
    if (!state.inputFile) return;
    
    this.store.dispatch(DenoiserActions.startProcessing());
    
    this.subscription.add(
      this.purifyService.process({
        file: state.inputFile,
        algorithm: state.algorithm,
        lumaStrength: state.lumaStrength,
        chromaStrength: state.chromaStrength,
        temporalStrength: state.temporalStrength,
        denoiseAudio: state.denoiseAudio,
        audioNoiseLevel: state.audioNoiseLevel
      }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') {
            this.store.dispatch(DenoiserActions.updateProgress({ progress: msg.value ?? 0 }));
          } else if (msg.type === 'complete') {
            const blob = new Blob([msg.data as BlobPart], { type: 'video/mp4' });
            this.store.dispatch(DenoiserActions.processingSuccess({ 
              outputBlob: blob,
              outputSizeMB: blob.size / (1024 * 1024)
            }));
          }
        },
        error: (err) => {
          this.store.dispatch(DenoiserActions.processingFailure({ 
            errorCode: 'FFMPEG_COMMAND_FAILED', 
            message: err.message ?? 'Purification kernel rejected frequency map.',
            retryable: true
          }));
        }
      })
    );
  }

  onDownload(state: DenoiserState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const filename = this.purifyService.getOutputFilename(state.inputFile?.name || 'video');
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  onReset(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = null;
    this.store.dispatch(DenoiserActions.resetState());
  }

  ngOnDestroy(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.subscription.unsubscribe();
  }
}