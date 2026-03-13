import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { InterpolatorActions, selectInterpolatorState, InterpolatorState, InterpolatorAlgorithm } from './interpolator.store';
import { InterpolatorService } from './interpolator.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-interpolator',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-blue-400 via-indigo-500 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Fluid Engine
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Motion Compensation: Frame Rate Synthesis v1.0</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.inputFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-cyan-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-cyan-950/30 transition-colors">
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
               <div class="p-6 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Optical Flow Synthesis</h4>
                    <p class="text-xs text-gray-500 mt-1">Generate intermediate frames via MCI (Motion Compensated Interpolation). Ideal for 24fps to 60fps upgrades.</p>
                  </div>
               </div>
               <div class="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Temporal Smoothing</h4>
                    <p class="text-xs text-gray-500 mt-1">Achieve cinema-grade fluid motion using AOBMC (Advanced Overlapped Block Motion Compensation).</p>
                  </div>
               </div>
            </div>
          </div>
        }

        <!-- Pillar 4: Component Logic Area -->
        @if (vm.inputFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8" [@fadeIn]>
            
            <!-- Left: Preview & Motion Simulation -->
            <div class="flex-1 flex flex-col gap-6">
              <div class="relative group rounded-3xl overflow-hidden border border-gray-800 shadow-2xl bg-black/40 aspect-video flex-col flex items-center justify-center">
                <app-video-preview [videoUrl]="videoUrl" (durationLoaded)="onDurationLoaded($event)"></app-video-preview>
                
                <!-- Fluidity Simulation Overlay -->
                <div class="absolute bottom-6 left-6 right-6 h-12 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 flex items-center px-4 overflow-hidden pointer-events-none z-10">
                   <div class="flex-1 flex items-center gap-2">
                      @for (i of [1,2,3,4,5,6,7,8]; track i) {
                        <div [style.animationDelay.ms]="i * 100" class="h-4 w-1 bg-cyan-500/40 rounded-full animate-pulse"></div>
                      }
                   </div>
                   <div class="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] font-mono">Frame_Delta_Map_Loaded</div>
                </div>

                @if (vm.status === 'processing') {
                   <div class="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-10" [@fadeIn]>
                      <app-progress-ring [progress]="vm.progress" [status]="'SYNTHESIZING'"></app-progress-ring>
                      <div class="mt-6 flex flex-col items-center gap-2 text-center px-6">
                         <p class="text-cyan-400 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse font-black">Estimating Motion Vectors</p>
                         <p class="text-gray-500 font-mono text-[8px] uppercase">Injecting Synthetic Temporal Frames</p>
                      </div>
                   </div>
                }

                <div class="absolute top-4 right-4 px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-lg backdrop-blur-md flex items-center gap-2">
                   <div class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                   <span class="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Fluid-Input v0.9</span>
                </div>
              </div>

              <!-- Stream Dashboard -->
              <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                 <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 font-mono">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Source Cadence</span>
                       <span class="text-white text-xs truncate uppercase tracking-tighter">{{ vm.videoMeta?.fps || 0 }} FPS</span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono">
                       <span class="text-[9px] font-black text-cyan-500/60 uppercase tracking-widest leading-none mb-1">Target Cadence</span>
                       <span class="text-cyan-400 text-xs font-black truncate uppercase">
                          {{ vm.targetFPS }} FPS
                       </span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Synthesis Logic</span>
                       <span class="text-white text-[10px] uppercase font-black tracking-tighter">
                          {{ vm.algorithm === 'duplicate' ? 'FRAME_DROP' : 'MOTION_COMP' }}
                       </span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pl-4 font-mono">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Delta Flow</span>
                       <span class="text-gray-400 text-[10px] tracking-tighter">fluid_sync_v0.5</span>
                    </div>
                 </div>
                 <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-transparent"></div>
              </div>
            </div>

            <!-- Right: Parameters Panel -->
            <div class="w-full lg:w-[420px] flex flex-col gap-6">
              
              <!-- Parameters Card -->
              <div class="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
                 
                 <!-- Cadence Matrix -->
                 <div>
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 leading-none italic opacity-60">Target Temporal Resolution</label>
                    <div class="grid grid-cols-4 gap-2">
                       @for (fps of ['24', '30', '60', '120']; track fps) {
                          <button (click)="onSetFPS(fps)" [class]="vm.targetFPS === fps ? 'bg-cyan-500 text-cyan-950 font-black border-cyan-400 shadow-lg shadow-cyan-500/20' : 'bg-black/40 text-gray-500 hover:text-white border-gray-800'"
                            class="py-3 rounded-xl text-[10px] uppercase font-black transition-all border">
                             {{ fps }}
                          </button>
                       }
                    </div>
                 </div>

                 <!-- Algorithm Selection -->
                 <div>
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 leading-none italic opacity-60">Interpolation Protocol</label>
                    <div class="flex flex-col gap-2">
                       <button (click)="onSetAlgorithm('duplicate')" [class]="vm.algorithm === 'duplicate' ? 'bg-cyan-500 text-cyan-950 font-black border-cyan-400' : 'bg-black/40 text-gray-500 hover:text-white border-gray-800 text-left'"
                         class="p-4 rounded-xl text-[10px] uppercase font-black transition-all border flex flex-col gap-1">
                          <span>Frame Duplication</span>
                          <span class="text-[8px] opacity-60 font-medium tracking-tight">Zero latency. simple duplication/dropping. Low quality.</span>
                       </button>
                       <button (click)="onSetAlgorithm('motion')" [class]="vm.algorithm === 'motion' ? 'bg-cyan-500 text-cyan-950 font-black border-cyan-400' : 'bg-black/40 text-gray-500 hover:text-white border-gray-800 text-left'"
                         class="p-4 rounded-xl text-[10px] uppercase font-black transition-all border flex flex-col gap-1">
                          <span>Motion Estimation (Expert)</span>
                          <span class="text-[8px] opacity-60 font-medium tracking-tight uppercase">High intensive MCI synthesis. Cinematic smooth results.</span>
                       </button>
                    </div>
                 </div>

                 <!-- Warning for Motion Estimation -->
                 @if (vm.algorithm === 'motion') {
                    <div class="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-3" [@fadeIn]>
                       <svg class="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                       <p class="text-[9px] font-black text-amber-400/80 uppercase tracking-widest leading-relaxed">Synthesis of intermediate vectors is highly CPU intensive. Prepare for extended kernel runtime.</p>
                    </div>
                 }

                 <!-- Action Area -->
                 <div class="pt-4 border-t border-gray-800/50">
                    @if (vm.status === 'idle' || vm.status === 'error') {
                       <button (click)="onInterpolate(vm)"
                         class="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90 text-white font-black py-4 rounded-2xl shadow-xl shadow-cyan-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                         Execute Fluid
                       </button>
                    } @else if (vm.status === 'success') {
                       <div class="space-y-3" [@slideUp]>
                          <button (click)="onDownload(vm)" 
                            class="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Export Synthesis
                          </button>
                          @if (vm.outputSizeMB) {
                            <p class="text-center text-[9px] font-mono text-gray-500 uppercase tracking-widest">Hydrated Volume: {{ vm.outputSizeMB.toFixed(2) }} MB</p>
                          }
                       </div>
                    } @else {
                       <div class="h-14 w-full bg-gray-800/20 rounded-2xl flex items-center justify-center border border-dashed border-gray-800 opacity-50">
                          <span class="text-[10px] font-mono text-gray-600 uppercase tracking-widest animate-pulse">Calculating Frame Deltas...</span>
                       </div>
                    }

                    @if (vm.status === 'error') {
                       <div class="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4" [@fadeIn]>
                          <svg class="w-5 h-5 text-rose-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                          <div class="flex-1">
                            <p class="text-white font-black text-xs uppercase tracking-tight">Arithmetic Overflow</p>
                            <p class="text-rose-400 font-mono text-[9px] mt-1 pr-2 leading-relaxed opacity-80">{{ vm.errorMessage || 'Unknown vector calculation fault' }}</p>
                            @if (vm.retryable) {
                               <button (click)="onInterpolate(vm)" class="mt-4 text-[10px] font-black uppercase text-white bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-full border border-white/10 transition-all">Restart System</button>
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
export class InterpolatorComponent implements OnDestroy {
  private store = inject(Store);
  private fluidService = inject(InterpolatorService);
  private subscription = new Subscription();
  
  readonly vm$ = this.store.select(selectInterpolatorState);
  videoUrl: string | null = null;

  onFileSelected(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(InterpolatorActions.loadFile({ file }));
  }

  onDurationLoaded(duration: number): void {
    this.store.dispatch(InterpolatorActions.loadMetaSuccess({
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

  onSetFPS(targetFPS: any): void { this.store.dispatch(InterpolatorActions.setTargetFPS({ targetFPS })); }
  onSetAlgorithm(algorithm: 'duplicate' | 'motion'): void { this.store.dispatch(InterpolatorActions.setAlgorithm({ algorithm })); }

  onInterpolate(state: InterpolatorState): void {
    if (!state.inputFile) return;
    
    this.store.dispatch(InterpolatorActions.startProcessing());
    
    this.subscription.add(
      this.fluidService.process({
        file: state.inputFile,
        targetFPS: state.targetFPS,
        algorithm: state.algorithm,
        videoMeta: state.videoMeta!
      }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') {
            this.store.dispatch(InterpolatorActions.updateProgress({ progress: msg.value ?? 0 }));
          } else if (msg.type === 'complete') {
            const blob = new Blob([msg.data as BlobPart], { type: 'video/mp4' });
            this.store.dispatch(InterpolatorActions.processingSuccess({ 
              outputBlob: blob,
              outputSizeMB: blob.size / (1024 * 1024)
            }));
          }
        },
        error: (err) => {
          this.store.dispatch(InterpolatorActions.processingFailure({ 
            errorCode: 'FFMPEG_COMMAND_FAILED', 
            message: err.message ?? 'Motion kernel calculation aborted.',
            retryable: true
          }));
        }
      })
    );
  }

  onDownload(state: InterpolatorState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const filename = this.fluidService.getOutputFilename(state.inputFile?.name || 'video', state.targetFPS);
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  onReset(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = null;
    this.store.dispatch(InterpolatorActions.resetState());
  }

  ngOnDestroy(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.subscription.unsubscribe();
  }
}