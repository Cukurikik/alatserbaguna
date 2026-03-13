import { fadeIn, slideUp, slideInRight, popIn, staggerFade, buttonState } from '../../../shared/animations';
import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { BlurActions, selectBlurState, BlurState } from './blur.store';
import { BlurService, BlurRegion } from './blur.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-blur',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-violet-400 via-purple-500 to-fuchsia-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Nebula Engine
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Spatial Diffusion: Bayesian Blur v1.0</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.inputFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-purple-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-purple-950/30 transition-colors">
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
               <div class="p-6 rounded-2xl bg-purple-500/5 border border-purple-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Privacy Masking</h4>
                    <p class="text-xs text-gray-500 mt-1">High-precision region blurring for face and sensitive data anonymization. Zero-latency spatial diffusion.</p>
                  </div>
               </div>
               <div class="p-6 rounded-2xl bg-fuchsia-500/5 border border-fuchsia-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-fuchsia-500/10 rounded-xl flex items-center justify-center text-fuchsia-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Gaussian Kernel</h4>
                    <p class="text-xs text-gray-500 mt-1">Mathematical box and gaussian blur implementation. Smooth transitions and customizable diffusion strength.</p>
                  </div>
               </div>
            </div>
          </div>
        }

        <!-- Pillar 4: Component Logic Area -->
        @if (vm.inputFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8" [@fadeIn]>
            
            <!-- Left: Preview & Region Visualizer -->
            <div class="flex-1 flex flex-col gap-6">
              <div class="relative group rounded-3xl overflow-hidden border border-gray-800 shadow-2xl bg-black/40 aspect-video flex-col flex items-center justify-center">
                <app-video-preview [videoUrl]="videoUrl" (durationLoaded)="onDurationLoaded($event)"></app-video-preview>
                
                <!-- Blur Region HUD -->
                @if (vm.mode === 'region') {
                   <div class="absolute inset-0 z-10">
                      <div class="absolute border-2 border-purple-500/50 bg-purple-500/5 backdrop-blur-sm rounded-lg flex items-center justify-center"
                        [style.left.%]="10" [style.top.%]="10" [style.width.%]="40" [style.height.%]="30">
                         <span class="text-[8px] font-black text-purple-400 uppercase tracking-widest bg-black/60 px-2 py-0.5 rounded">DIFF_KERNEL_ACTIVE</span>
                      </div>
                   </div>
                }

                @if (vm.status === 'processing') {
                   <div class="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-10" [@fadeIn]>
                      <app-progress-ring [progress]="vm.progress" [status]="'DIFFUSING'"></app-progress-ring>
                      <div class="mt-6 flex flex-col items-center gap-2 text-center px-6">
                         <p class="text-purple-400 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse font-black">Applying Gaussian Kernel</p>
                         <p class="text-gray-500 font-mono text-[8px] uppercase">Mapping Spatial Error Diffusion</p>
                      </div>
                   </div>
                }

                <div class="absolute top-4 right-4 px-3 py-1 bg-purple-500/20 border border-purple-500/40 rounded-lg backdrop-blur-md flex items-center gap-2">
                   <div class="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></div>
                   <span class="text-[9px] font-black text-purple-400 uppercase tracking-widest">Nebula-Input v1.0</span>
                </div>
              </div>

              <!-- Metrics -->
              <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                 <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 font-mono text-center">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Source Stream</span>
                       <span class="text-white text-xs truncate uppercase tracking-tighter">{{ vm.videoMeta?.width }}x{{ vm.videoMeta?.height }}</span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono text-center">
                       <span class="text-[9px] font-black text-purple-500/60 uppercase tracking-widest leading-none mb-1">Blur Radius</span>
                       <span class="text-purple-400 text-xs font-black truncate uppercase">
                          {{ vm.strength }} PX
                       </span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono text-center">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Spatial Mode</span>
                       <span class="text-white text-[10px] uppercase font-black">
                          {{ vm.mode.toUpperCase() }}
                       </span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pl-4 font-mono text-center">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Hash Node</span>
                       <span class="text-gray-400 text-[10px] tracking-tighter">nebula_diff_v1.0</span>
                    </div>
                 </div>
                 <div class="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-transparent"></div>
              </div>
            </div>

            <!-- Right: Parameters Panel -->
            <div class="w-full lg:w-[420px] flex flex-col gap-6">
              
              <!-- Parameters Card -->
              <div class="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
                 
                 <!-- Mode Selection -->
                 <div>
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 leading-none italic opacity-60">Diffusion Matrix Mode</label>
                    <div class="grid grid-cols-3 gap-2">
                       <button (click)="onSetMode('full')" [class]="vm.mode === 'full' ? 'bg-purple-500 text-purple-950 font-black border-purple-400 shadow-lg shadow-purple-500/20' : 'bg-black/40 text-gray-500 hover:text-white border-gray-800'"
                         class="py-4 rounded-xl text-[9px] uppercase font-black transition-all border flex flex-col items-center gap-1">Global</button>
                       <button (click)="onSetMode('region')" [class]="vm.mode === 'region' ? 'bg-purple-500 text-purple-950 font-black border-purple-400 shadow-lg shadow-purple-500/20' : 'bg-black/40 text-gray-500 hover:text-white border-gray-800'"
                         class="py-4 rounded-xl text-[9px] uppercase font-black transition-all border flex flex-col items-center gap-1">Region</button>
                       <button (click)="onSetMode('background')" [class]="vm.mode === 'background' ? 'bg-purple-500 text-purple-950 font-black border-purple-400 shadow-lg shadow-purple-500/20' : 'bg-black/40 text-gray-500 hover:text-white border-gray-800'"
                         class="py-4 rounded-xl text-[9px] uppercase font-black transition-all border flex flex-col items-center gap-1">BG_Only</button>
                    </div>
                 </div>

                 <!-- Strength Area -->
                 <div class="p-5 bg-black/40 rounded-2xl border border-gray-800">
                    <div class="flex justify-between items-center mb-3">
                       <label class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none">Diffusion Radius</label>
                       <span class="text-[9px] font-mono text-purple-400 font-black">{{ vm.strength }} PX</span>
                    </div>
                    <input type="range" min="1" max="50" step="1" [value]="vm.strength" (input)="onSetStrength($event)"
                      class="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500">
                    <div class="flex justify-between mt-2 text-[8px] font-mono text-gray-700 uppercase">
                       <span>Sharp</span>
                       <span>Diffusion_Limit</span>
                    </div>
                 </div>

                 <!-- Temporal Offset -->
                 <div class="grid grid-cols-2 gap-4">
                    <div class="p-4 bg-black/40 rounded-2xl border border-gray-800 flex flex-col gap-2">
                       <label class="text-[9px] font-black text-gray-600 uppercase tracking-widest">Entry_TX</label>
                       <input type="number" [value]="vm.startTime || 0" (input)="onSetStart($event)" class="bg-transparent border-none p-0 text-white font-mono font-black text-xl">
                    </div>
                    <div class="p-4 bg-black/40 rounded-2xl border border-gray-800 flex flex-col gap-2">
                       <label class="text-[9px] font-black text-gray-600 uppercase tracking-widest">Exit_TX</label>
                       <input type="number" [value]="vm.endTime || (vm.videoMeta?.duration || 0)" (input)="onSetEnd($event)" class="bg-transparent border-none p-0 text-white font-mono font-black text-xl">
                    </div>
                 </div>

                 <!-- Action -->
                 <div class="pt-4 border-t border-gray-800/50">
                    @if (vm.status === 'idle' || vm.status === 'error') {
                       <button (click)="onProcess(vm)"
                         class="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 text-white font-black py-4 rounded-2xl shadow-xl shadow-purple-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                         Start Diffusion
                       </button>
                    } @else if (vm.status === 'success') {
                       <div class="space-y-3" [@slideUp]>
                          <button (click)="onDownload(vm)" 
                            class="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Export Diffused
                          </button>
                          @if (vm.outputSizeMB) {
                            <p class="text-center text-[9px] font-mono text-gray-500 uppercase tracking-widest">Hydrated Volume: {{ vm.outputSizeMB.toFixed(2) }} MB</p>
                          }
                       </div>
                    } @else {
                       <div class="h-14 w-full bg-gray-800/20 rounded-2xl flex items-center justify-center border border-dashed border-gray-800 opacity-50">
                          <span class="text-[10px] font-mono text-gray-600 uppercase tracking-widest animate-pulse">Computing Spatial Error...</span>
                       </div>
                    }
                 </div>
              </div>

              <!-- Info Footer -->
              <div class="px-2 pt-2 text-[9px] font-mono text-gray-600 uppercase tracking-tighter opacity-40 italic">
                 privacy_guard_nebula_v1.0_enabled
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
export class BlurComponent implements OnDestroy {
  private store = inject(Store);
  private nebulaService = inject(BlurService);
  private subscription = new Subscription();
  
  readonly vm$ = this.store.select(selectBlurState);
  videoUrl: string | null = null;

  onFileSelected(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(BlurActions.loadFile({ file }));
  }

  onDurationLoaded(duration: number): void {
    this.store.dispatch(BlurActions.loadMetaSuccess({
      meta: {
        filename: 'video', fileSizeMB: 0, duration,
        width: 1920, height: 1080, fps: 30, codec: 'h264',
        audioCodec: 'aac', audioBitrate: 128, videoBitrate: 0,
        hasAudio: true, aspectRatio: '16:9',
      }
    }));
  }

  onSetMode(mode: any): void { this.store.dispatch(BlurActions.setMode({ mode })); }
  onSetStrength(e: Event): void { this.store.dispatch(BlurActions.setStrength({ strength: parseInt((e.target as HTMLInputElement).value, 10) })); }
  onSetStart(e: Event): void { this.store.dispatch(BlurActions.setStartTime({ time: parseFloat((e.target as HTMLInputElement).value) })); }
  onSetEnd(e: Event): void { this.store.dispatch(BlurActions.setEndTime({ time: parseFloat((e.target as HTMLInputElement).value) })); }

  onProcess(state: BlurState): void {
    if (!state.inputFile) return;
    
    this.store.dispatch(BlurActions.startProcessing());
    
    this.subscription.add(
      this.nebulaService.process({
        file: state.inputFile,
        mode: state.mode,
        strength: state.strength,
        region: state.region || { x: state.videoMeta!.width * 0.1, y: state.videoMeta!.height * 0.1, w: state.videoMeta!.width * 0.4, h: state.videoMeta!.height * 0.3 },
        startTime: state.startTime,
        endTime: state.endTime
      }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') {
            this.store.dispatch(BlurActions.updateProgress({ progress: msg.value ?? 0 }));
          } else if (msg.type === 'complete') {
            const blob = new Blob([msg.data as BlobPart], { type: 'video/mp4' });
            this.store.dispatch(BlurActions.processingSuccess({ 
              outputBlob: blob,
              outputSizeMB: blob.size / (1024 * 1024)
            }));
          }
        },
        error: (err) => {
          this.store.dispatch(BlurActions.processingFailure({ 
            errorCode: 'FFMPEG_COMMAND_FAILED', 
            message: err.message ?? 'Spatial diffusion kernel calculation aborted.',
            retryable: true
          }));
        }
      })
    );
  }

  onDownload(state: BlurState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const filename = this.nebulaService.getOutputFilename(state.inputFile?.name || 'video');
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  onReset(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = null;
    this.store.dispatch(BlurActions.resetState());
  }

  ngOnDestroy(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.subscription.unsubscribe();
  }
}