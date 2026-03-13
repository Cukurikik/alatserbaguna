import { fadeIn, slideUp, slideInRight, popIn, staggerFade, buttonState } from '../../../shared/animations';
import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
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
  imports: [AsyncPipe, DecimalPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Velocity Engine
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Momentum Engine: Temporal Scaling v1.0</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.inputFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-yellow-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-yellow-950/30 transition-colors">
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
            
            <div class="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
               <div class="p-8 rounded-[2.5rem] bg-gray-900/40 border border-gray-800 backdrop-blur-md flex items-start gap-6 group hover:border-yellow-500/30 transition-all duration-500">
                  <div class="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-400 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-xl shadow-yellow-500/5">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-black text-sm uppercase tracking-tight italic">Temporal Warping</h4>
                    <p class="text-[10px] text-gray-500 mt-2 leading-relaxed font-medium uppercase tracking-widest opacity-60 italic">Accelerate or slow down streams using high-precision SetPTS filters without losing frame data or visual fidelity.</p>
                  </div>
               </div>
               <div class="p-8 rounded-[2.5rem] bg-gray-900/40 border border-gray-800 backdrop-blur-md flex items-start gap-6 group hover:border-orange-500/30 transition-all duration-500">
                  <div class="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-400 shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform shadow-xl shadow-orange-500/5">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.536 8.464L19 12m0 0l-3.464 3.536M19 12H5"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 18.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-black text-sm uppercase tracking-tight italic">Phase-Aligned Audio</h4>
                    <p class="text-[10px] text-gray-400 mt-2 leading-relaxed font-medium uppercase tracking-widest opacity-60 italic">Advanced Atempo chaining handles extreme speed multipliers while correcting pitch distortion and phase shift.</p>
                  </div>
               </div>
            </div>
          </div>
        }

        @if (vm.inputFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8 min-h-0" [@fadeIn]>
            
            <div class="flex-1 flex flex-col gap-8 min-h-0">
              <div class="relative group rounded-[2.5rem] overflow-hidden border border-gray-800 shadow-2xl bg-black/40 backdrop-blur-md">
                <app-video-preview [videoUrl]="videoUrl" (durationLoaded)="onDurationLoaded($event)"></app-video-preview>
                
                @if (vm.status === 'processing') {
                   <div class="absolute inset-0 bg-gray-950/70 backdrop-blur-md flex flex-col items-center justify-center z-10" [@fadeIn]>
                      <app-progress-ring [progress]="vm.progress" [status]="'WARPING_TIME'"></app-progress-ring>
                      <div class="mt-8 flex flex-col items-center gap-2">
                         <span class="text-yellow-400 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse italic font-black">Velocity_Core_Syncing</span>
                         <span class="text-gray-500 font-mono text-[8px] uppercase tracking-widest opacity-60 italic">Resampling Presentation Time...</span>
                      </div>
                   </div>
                }
              </div>

              <!-- Metrics -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                 <div class="bg-gray-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-gray-800 flex flex-col gap-3 shadow-xl group hover:border-yellow-500/20 transition-colors">
                    <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest italic opacity-60 leading-none">Base_Duration</span>
                    <span class="text-white font-mono text-xs font-black italic tracking-tighter">{{ vm.videoMeta?.duration | number:'1.2-2' }}s</span>
                 </div>
                 <div class="bg-gray-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-gray-800 flex flex-col gap-3 shadow-xl group hover:border-yellow-500/20 transition-colors">
                    <span class="text-[10px] font-black text-yellow-500 uppercase tracking-widest italic opacity-60 leading-none">Velocity_Unit</span>
                    <span class="text-yellow-400 font-mono text-xs font-black italic tracking-tighter">{{ vm.speed }}x</span>
                 </div>
                 <div class="bg-gray-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-gray-800 flex flex-col gap-3 shadow-xl group hover:border-yellow-500/20 transition-colors">
                    <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest italic opacity-60 leading-none">Target_Pulse</span>
                    <span class="text-white font-mono text-xs font-black italic tracking-tighter">
                       {{ vm.videoMeta ? (vm.videoMeta.duration / vm.speed) : 0 | number:'1.2-2' }}s
                    </span>
                 </div>
                 <div class="bg-gray-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-gray-800 flex flex-col gap-3 shadow-xl group hover:border-yellow-500/20 transition-colors">
                    <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest italic opacity-60 leading-none">Frequency_Shift</span>
                    <span class="text-gray-400 font-mono text-xs font-black italic tracking-tighter">~{{ ((vm.videoMeta?.fps || 0) * vm.speed) | number:'1.1-1' }} Hz</span>
                 </div>
              </div>
            </div>

            <div class="w-full lg:w-[420px] shrink-0 flex flex-col gap-8">
              
              <!-- Settings Panel -->
              <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-[2.5rem] p-10 flex flex-col gap-10 shadow-2xl relative overflow-hidden">
                 <div class="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent"></div>
                 
                 <!-- Preset Grid -->
                 <div class="p-8 bg-black/40 rounded-[2rem] border border-gray-800 shadow-xl group hover:border-yellow-500/20 transition-colors duration-500">
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] italic opacity-60 mb-6">Velocity_Presets</label>
                    <div class="grid grid-cols-4 gap-3">
                      @for (sp of speeds; track sp) {
                        <button (click)="onSetSpeed(sp)"
                          [class]="vm.speed === sp
                            ? 'bg-yellow-500 text-yellow-950 font-black shadow-[0_0_15px_rgba(234,179,8,0.3)] scale-105'
                            : 'bg-white/5 text-gray-500 hover:bg-gray-800 hover:text-white border border-white/5'"
                          class="py-4 rounded-xl text-[10px] font-black font-mono transition-all uppercase tracking-widest italic active:scale-95">
                          {{ sp }}x
                        </button>
                      }
                    </div>
                 </div>

                 <!-- Audio Sync Mode -->
                 <div class="p-8 bg-black/40 rounded-[2rem] border border-gray-800 shadow-xl group hover:border-yellow-500/20 transition-colors duration-500">
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] italic opacity-60 mb-6">Acoustic_Logic</label>
                    <div class="flex flex-col gap-3">
                       <button (click)="onSetAudioMode('pitchCorrect')"
                         [class]="vm.audioMode === 'pitchCorrect' ? 'bg-yellow-500/10 border-yellow-500/40 text-white' : 'bg-white/5 border-white/5 text-gray-500 opacity-60'"
                         class="flex items-center gap-4 p-5 rounded-2xl border transition-all text-left group/btn">
                          <div [class]="vm.audioMode === 'pitchCorrect' ? 'bg-yellow-400' : 'bg-gray-800'" class="w-3 h-3 rounded-full shrink-0 shadow-inner transition-colors"></div>
                          <div>
                             <p class="text-[10px] font-black uppercase italic tracking-tight mb-1">Pitch_Correct_Chain</p>
                             <p class="text-[8px] uppercase font-black italic tracking-widest opacity-40">Maintain original audible spectrum.</p>
                          </div>
                       </button>
                       <button (click)="onSetAudioMode('mute')"
                         [class]="vm.audioMode === 'mute' ? 'bg-rose-500/10 border-rose-500/40 text-white' : 'bg-white/5 border-white/5 text-gray-500 opacity-60'"
                         class="flex items-center gap-4 p-5 rounded-2xl border transition-all text-left">
                          <div [class]="vm.audioMode === 'mute' ? 'bg-rose-500' : 'bg-gray-800'" class="w-3 h-3 rounded-full shrink-0 shadow-inner"></div>
                          <div>
                             <p class="text-[10px] font-black uppercase italic tracking-tight mb-1">Neutralize_Stream</p>
                             <p class="text-[8px] uppercase font-black italic tracking-widest opacity-40">Purge acoustic footprints.</p>
                          </div>
                       </button>
                    </div>
                 </div>

                 <!-- Action Button Area -->
                 <div class="pt-6 border-t border-gray-800/50">
                    @if (vm.status === 'idle' || vm.status === 'error') {
                       <button (click)="onApplySpeed(vm)"
                         class="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:opacity-90 text-yellow-950 font-black py-5 rounded-2xl shadow-2xl shadow-yellow-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.25em] flex items-center justify-center gap-4 italic">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                         Energize Velocity Change
                       </button>
                    } @else if (vm.status === 'success') {
                       <div class="space-y-4" [@slideUp]>
                          <button (click)="onDownload(vm)" 
                            class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 group italic">
                            <svg class="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Export Warped Stream
                          </button>
                          @if (vm.outputSizeMB) {
                            <p class="text-center text-[9px] font-black font-mono text-emerald-500/60 uppercase tracking-[0.3em] italic">Density_Verified: {{ vm.outputSizeMB | number:'1.2-2' }} MB</p>
                          }
                       </div>
                    } @else {
                       <div class="h-16 w-full bg-gray-950/40 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-800/50 opacity-40">
                          <span class="text-[10px] font-black font-mono text-gray-500 uppercase tracking-[0.4em] animate-pulse italic">Aligning_Engine_Pulse...</span>
                       </div>
                    }

                    @if (vm.status === 'error') {
                       <div class="mt-6 p-6 bg-rose-500/5 border border-rose-500/20 rounded-[1.5rem] flex items-start gap-4 animate-in shake-1 duration-500" [@fadeIn]>
                          <div class="w-10 h-10 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 shrink-0 shadow-lg">
                             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                          </div>
                          <div class="flex-1 min-w-0">
                            <p class="text-white font-black text-xs uppercase tracking-tight italic">Velocity_Warp_Failure</p>
                            <p class="text-rose-400 font-black font-mono text-[9px] mt-1.5 leading-relaxed uppercase tracking-wider opacity-80 italic line-clamp-2">{{ vm.errorMessage || 'Unknown temporal divergence' }}</p>
                            @if (vm.retryable) {
                               <button (click)="onApplySpeed(vm)" class="mt-4 text-[9px] font-black uppercase text-white border-b-2 border-white/10 hover:border-yellow-500 transition-all hover:text-yellow-400 tracking-[0.2em] italic">Retry_Attempt_Ops</button>
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
            message: err.message ?? 'Velocity warp failed. Try a moderate velocity multiplier.',
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
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
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