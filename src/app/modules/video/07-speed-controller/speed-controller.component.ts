import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { SpeedControllerActions, selectSpeedControllerState, SpeedControllerState } from './speed-controller.store';
import { SpeedControllerService } from './speed-controller.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

const SPEEDS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 4.0];

@Component({
  selector: 'app-speed-controller',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Speed Controller
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Momentum Engine: Temporal Scaling</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.inputFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-rose-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-rose-950/30 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </span>
              Restart
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
               <div class="p-6 rounded-2xl bg-yellow-500/5 border border-yellow-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Temporal Warping</h4>
                    <p class="text-xs text-gray-500 mt-1">Accelerate or slow down streams using high-precision SetPTS filters without losing frame data.</p>
                  </div>
               </div>
               <div class="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464L19 12m0 0l-3.464 3.536M19 12H5"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Phase-Aligned Audio</h4>
                    <p class="text-xs text-gray-500 mt-1">Advanced Atempo chaining handles extreme speed multipliers while correcting pitch distortion.</p>
                  </div>
               </div>
            </div>
          </div>
        }

        <!-- Pillar 4: Component Logic Area -->
        @if (vm.inputFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8" [@fadeIn]>
            
            <!-- Left: Preview & Gauge -->
            <div class="flex-1 flex flex-col gap-6">
              <div class="relative group rounded-3xl overflow-hidden border border-gray-800 shadow-2xl bg-black/40 aspect-video flex items-center justify-center">
                <app-video-preview [videoUrl]="videoUrl" (durationLoaded)="onDurationLoaded($event)"></app-video-preview>
                
                @if (vm.status === 'processing') {
                   <div class="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-10" [@fadeIn]>
                      <app-progress-ring [progress]="vm.progress" [status]="'WARPING'"></app-progress-ring>
                      <div class="mt-6 flex flex-col items-center gap-2 text-center px-6">
                         <p class="text-yellow-400 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse font-black">Applying {{ vm.speed }}x Velocity</p>
                         <p class="text-gray-500 font-mono text-[8px] uppercase">Re-calculating Presentation Time Stamps</p>
                      </div>
                   </div>
                }
              </div>

              <!-- Speed Metrics Dashboard -->
              <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-xl relative group overflow-hidden">
                 <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest">Base Duration</span>
                       <span class="text-white font-mono text-xl tracking-tighter">{{ vm.videoMeta?.duration?.toFixed(2) || '---' }}s</span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4">
                       <span class="text-[9px] font-black text-yellow-500/60 uppercase tracking-widest leading-none">Velocity Multiplier</span>
                       <span class="text-yellow-400 font-mono text-xl font-black tracking-tighter">{{ vm.speed }}x</span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest">Target Duration</span>
                       <span class="text-white text-xl tracking-tighter">
                          {{ vm.videoMeta ? (vm.videoMeta.duration / vm.speed).toFixed(2) : '---' }}s
                       </span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pl-4">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none">FPS Delta</span>
                       <span class="text-gray-400 font-mono text-lg tracking-tighter">~{{ ((vm.videoMeta?.fps || 0) * vm.speed).toFixed(1) }} Hz</span>
                    </div>
                 </div>
                 <div class="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-transparent"></div>
              </div>
            </div>

            <!-- Right: Settings Panel -->
            <div class="w-full lg:w-[420px] flex flex-col gap-6">
              
              <!-- Parameters Card -->
              <div class="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden">
                 
                 <!-- Preset Grid -->
                 <div>
                   <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 leading-none">Velocity Presets</label>
                   <div class="grid grid-cols-4 gap-2">
                     @for (sp of speeds; track sp) {
                       <button (click)="onSetSpeed(sp)"
                         [class]="vm.speed === sp
                           ? 'bg-yellow-500 text-yellow-950 font-black shadow-lg shadow-yellow-500/20 scale-105'
                           : 'bg-black/40 text-gray-500 hover:bg-gray-800 hover:text-white border border-gray-800'"
                         class="py-4 px-1 rounded-xl text-[10px] font-mono transition-all uppercase tracking-widest leading-none active:scale-95">
                         {{ sp }}x
                       </button>
                     }
                   </div>
                   <div class="mt-4 flex items-center justify-between px-2">
                      <span class="text-[8px] font-black text-gray-600 uppercase">Slow-Mo</span>
                      <span class="text-[8px] font-black text-gray-600 uppercase">Hyper-Speed</span>
                   </div>
                 </div>

                 <!-- Audio Sync Mode -->
                 <div>
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 leading-none">Acoustic Logic</label>
                    <div class="flex flex-col gap-2">
                       <button (click)="onSetAudioMode('pitchCorrect')"
                         [class]="vm.audioMode === 'pitchCorrect' ? 'bg-yellow-500/10 border-yellow-500/40 text-white' : 'bg-black/20 border-gray-800 text-gray-500 opacity-60'"
                         class="flex items-start gap-4 p-4 rounded-2xl border transition-all text-left group">
                          <div [class]="vm.audioMode === 'pitchCorrect' ? 'bg-yellow-400' : 'bg-gray-800'" class="w-2.5 h-2.5 rounded-full mt-1 shrink-0"></div>
                          <div>
                             <p class="text-[10px] font-black uppercase leading-none mb-1">Pitch Correction (Atempo)</p>
                             <p class="text-[8px] uppercase tracking-tighter opacity-60">Resample audio to maintain original pitch.</p>
                          </div>
                       </button>
                       <button (click)="onSetAudioMode('mute')"
                         [class]="vm.audioMode === 'mute' ? 'bg-rose-500/10 border-rose-500/40 text-white' : 'bg-black/20 border-gray-800 text-gray-500 opacity-60'"
                         class="flex items-start gap-4 p-4 rounded-2xl border transition-all text-left">
                          <div [class]="vm.audioMode === 'mute' ? 'bg-rose-500' : 'bg-gray-800'" class="w-2.5 h-2.5 rounded-full mt-1 shrink-0"></div>
                          <div>
                             <p class="text-[10px] font-black uppercase leading-none mb-1">Mute Stream</p>
                             <p class="text-[8px] uppercase tracking-tighter opacity-60">Strip all audio data from the container.</p>
                          </div>
                       </button>
                    </div>
                 </div>

                 <!-- Logic Visualization -->
                 <div class="bg-black/50 rounded-2xl p-6 border border-gray-800/50">
                    <p class="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4">Command Topology</p>
                    <div class="space-y-4">
                       <div class="flex flex-col gap-2">
                          <div class="flex justify-between items-center text-[9px] font-mono leading-none">
                             <span class="text-gray-500 uppercase">Set Presentation Time</span>
                             <span class="text-yellow-400 px-1 bg-yellow-500/5">{{ (1/vm.speed).toFixed(3) }}*PTS</span>
                          </div>
                          <div class="h-1 bg-gray-800 rounded-full overflow-hidden">
                             <div class="h-full bg-yellow-500" [style.width]="(vm.speed / 4 * 100) + '%'"></div>
                          </div>
                       </div>
                       <div class="text-[9px] font-mono text-gray-500 truncate group border-t border-gray-800/50 pt-3 mt-2">
                          <span class="opacity-40">Filters: </span>
                          <span class="text-yellow-400/80 italic">setpts={{ (1/vm.speed).toFixed(3) }}*PTS{{ vm.audioMode === 'pitchCorrect' ? ',atempo=...' : '' }}</span>
                       </div>
                    </div>
                 </div>

                 <!-- Footer Actions -->
                 <div class="pt-4 border-t border-gray-800/50">
                    @if (vm.status === 'idle' || vm.status === 'error') {
                       <button (click)="onApplySpeed(vm)"
                         class="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-yellow-950 font-black py-4 rounded-2xl shadow-xl shadow-yellow-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                         Engage Velocity Change
                       </button>
                    } @else if (vm.status === 'success') {
                       <div class="space-y-3" [@slideUp]>
                          <button (click)="onDownload(vm)" 
                            class="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Export Results
                          </button>
                          @if (vm.outputSizeMB) {
                            <p class="text-center text-[9px] font-mono text-gray-500 uppercase tracking-widest">Warped Volume: {{ vm.outputSizeMB.toFixed(2) }} MB</p>
                          }
                       </div>
                    } @else {
                       <div class="h-14 w-full bg-gray-800/20 rounded-2xl flex items-center justify-center border border-dashed border-gray-800 opacity-50">
                          <span class="text-[10px] font-mono text-gray-600 uppercase tracking-widest animate-pulse">Syncing Engine Pipeline...</span>
                       </div>
                    }

                    @if (vm.status === 'error') {
                       <div class="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4" [@fadeIn]>
                          <svg class="w-5 h-5 text-rose-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                          <div class="flex-1">
                            <p class="text-white font-black text-xs uppercase leading-tight tracking-tight tracking-tighter">Temporal Deviation Error</p>
                            <p class="text-rose-400 font-mono text-[9px] mt-1 pr-2 leading-relaxed opacity-80">{{ vm.errorMessage || 'Unknown speed divergence' }}</p>
                            @if (vm.retryable) {
                               <button (click)="onApplySpeed(vm)" class="mt-4 text-[10px] font-black uppercase text-white bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-full border border-white/10 transition-all">Re-warp Stream</button>
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
export class SpeedControllerComponent implements OnDestroy {
  private store = inject(Store);
  private speedService = inject(SpeedControllerService);
  private subscription = new Subscription();
  
  readonly vm$ = this.store.select(selectSpeedControllerState);
  videoUrl: string | null = null;
  readonly speeds = SPEEDS;

  onFileSelected(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(SpeedControllerActions.loadFile({ file }));
  }

  onDurationLoaded(duration: number): void {
    this.store.dispatch(SpeedControllerActions.loadMetaSuccess({
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

  onSetSpeed(speed: number): void { this.store.dispatch(SpeedControllerActions.setSpeed({ speed })); }
  onSetAudioMode(audioMode: 'keep' | 'mute' | 'pitchCorrect'): void { this.store.dispatch(SpeedControllerActions.setAudioMode({ audioMode })); }

  onApplySpeed(state: SpeedControllerState): void {
    if (!state.inputFile || !state.videoMeta) return;
    
    this.store.dispatch(SpeedControllerActions.startProcessing());
    
    this.subscription.add(
      this.speedService.process({
        file: state.inputFile,
        speed: state.speed,
        audioMode: state.audioMode,
        videoMeta: state.videoMeta
      }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') {
            this.store.dispatch(SpeedControllerActions.updateProgress({ progress: msg.value ?? 0 }));
          } else if (msg.type === 'complete') {
            const blob = new Blob([msg.data as BlobPart], { type: 'video/mp4' });
            this.store.dispatch(SpeedControllerActions.processingSuccess({ 
              outputBlob: blob,
              outputSizeMB: blob.size / (1024 * 1024)
            }));
          }
        },
        error: (err) => {
          this.store.dispatch(SpeedControllerActions.processingFailure({ 
            errorCode: 'FFMPEG_COMMAND_FAILED', 
            message: err.message ?? 'Speed manipulation failed. Try a moderate velocity.',
            retryable: true
          }));
        }
      })
    );
  }

  onDownload(state: SpeedControllerState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const filename = this.speedService.getOutputFilename(state.inputFile?.name || 'video', state.speed);
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
    this.store.dispatch(SpeedControllerActions.resetState());
  }

  ngOnDestroy(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.subscription.unsubscribe();
  }
}