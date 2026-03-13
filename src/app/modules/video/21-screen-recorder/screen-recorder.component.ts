import { fadeIn, slideUp, slideInRight, popIn, staggerFade, buttonState } from '../../../shared/animations';
import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { ScreenRecorderActions, selectScreenRecorderState, ScreenRecorderState } from './screen-recorder.store';
import { ScreenRecorderService, ScreenRecorderConfig } from './screen-recorder.service';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-screen-recorder',
  standalone: true,
  imports: [AsyncPipe, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-rose-400 via-pink-500 to-purple-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Captis Engine
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Temporal Grab: High-Framerate Capture v1.0</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.outputBlob) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-rose-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-rose-950/30 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </span>
              Dispose
            </button>
          }
        }
      </div>

      @if (vm$ | async; as vm) {
        
        <div class="flex-1 flex flex-col lg:flex-row gap-8" [@fadeIn]>
            
            <!-- Left: Viewfinder & Stream State -->
            <div class="flex-1 flex flex-col gap-6">
              <div class="relative group rounded-3xl overflow-hidden border border-gray-800 shadow-2xl bg-black/60 aspect-video flex flex-col items-center justify-center">
                
                <!-- Live Capture Preview (if recording) -->
                @if (vm.recording) {
                   <div class="absolute inset-0 z-0 opacity-40">
                      <div class="w-full h-full bg-gradient-to-br from-rose-500/10 via-transparent to-purple-500/10 animate-pulse"></div>
                   </div>
                }

                <div class="relative z-10 flex flex-col items-center gap-6">
                   @if (!vm.recording && !vm.outputBlob) {
                      <div class="w-24 h-24 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center text-rose-500/40 scale-150 mb-4 animate-bounce">
                         <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                      </div>
                      <p class="text-xs font-black text-white/40 uppercase tracking-[0.4em] font-mono italic">Awaiting_Stream_Link...</p>
                   }

                   @if (vm.recording) {
                      <div class="flex flex-col items-center gap-4">
                         <div class="flex items-center gap-6">
                            <div class="w-4 h-4 bg-rose-500 rounded-full animate-ping"></div>
                            <span class="text-4xl font-mono font-black text-white tracking-widest tabular-nums">{{ formatTime(vm.elapsedSeconds) }}</span>
                         </div>
                         <div class="flex items-center gap-2 px-4 py-1.5 bg-rose-500/20 border border-rose-500/40 rounded-full">
                            <span class="text-[9px] font-black text-rose-400 uppercase tracking-widest">LIVE_CAPTIS_REC_STREAM_v1</span>
                         </div>
                      </div>
                   }

                   @if (vm.status === 'processing') {
                      <app-progress-ring [progress]="vm.progress" [status]="'ENCODING'"></app-progress-ring>
                      <div class="mt-4 flex flex-col items-center text-center">
                         <p class="text-rose-400 font-mono text-[10px] uppercase tracking-[0.3em] font-black animate-pulse">Flushing Temporal Buffer</p>
                         <p class="text-gray-500 font-mono text-[8px] uppercase">Re-mapping Frame Interleaving</p>
                      </div>
                   }

                   @if (vm.status === 'success' && vm.outputBlob) {
                      <div class="flex flex-col items-center gap-4" [@slideUp]>
                         <div class="w-16 h-16 bg-emerald-500 text-emerald-950 rounded-full flex items-center justify-center shadow-[0_0_30px_#10b981]">
                            <svg class="w-8 h-8 font-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                         </div>
                         <p class="text-[10px] font-black text-emerald-400 uppercase tracking-widest font-mono">Stream_Locked_Available</p>
                      </div>
                   }
                </div>

                <!-- Viewfinder Accents -->
                <div class="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-white/20"></div>
                <div class="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-white/20"></div>
                <div class="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-white/20"></div>
                <div class="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-white/20"></div>
              </div>

              <!-- Metrics Dashboard -->
              <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                 <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 font-mono">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Capture Res</span>
                       <span class="text-white text-xs truncate uppercase tracking-tighter">{{ vm.resolution }} // 30 FPS</span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono">
                       <span class="text-[9px] font-black text-rose-500/60 uppercase tracking-widest leading-none mb-1">Audio Bridge</span>
                       <span class="text-rose-400 text-xs font-black truncate uppercase">
                          {{ vm.audioSource === 'none' ? 'BYPASS' : vm.audioSource.toUpperCase() }}
                       </span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Codec Sink</span>
                       <span class="text-white text-[10px] uppercase font-black">
                          {{ vm.outputFormat === 'mp4' ? 'H264_AAC' : 'VP9_OPUS' }}
                       </span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pl-4 font-mono">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Captis Level</span>
                       <span class="text-gray-400 text-[10px] tracking-tighter">capt_engine_v1.0</span>
                    </div>
                 </div>
                 <div class="absolute inset-0 bg-gradient-to-r from-rose-500/5 via-transparent to-transparent"></div>
              </div>
            </div>

            <!-- Right: Control Panel -->
            <div class="w-full lg:w-[400px] flex flex-col gap-6">
              
              <div class="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
                 
                 <!-- Audio Feed Selection -->
                 <div>
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 leading-none italic opacity-60">Audio Influx Router</label>
                    <div class="grid grid-cols-2 gap-2">
                       <button (click)="onSetAudio('mic')" [disabled]="vm.recording" [class]="vm.audioSource === 'mic' ? 'bg-rose-500 text-rose-950 font-black border-rose-400' : 'bg-black/40 text-gray-500 hover:text-white border-gray-800'"
                         class="py-3 rounded-xl text-[9px] uppercase font-black transition-all border disabled:opacity-30">
                          Microphone
                       </button>
                       <button (click)="onSetAudio('system')" [disabled]="vm.recording" [class]="vm.audioSource === 'system' ? 'bg-rose-500 text-rose-950 font-black border-rose-400' : 'bg-black/40 text-gray-500 hover:text-white border-gray-800'"
                         class="py-3 rounded-xl text-[9px] uppercase font-black transition-all border disabled:opacity-30">
                          System
                       </button>
                       <button (click)="onSetAudio('both')" [disabled]="vm.recording" [class]="vm.audioSource === 'both' ? 'bg-rose-500 text-rose-950 font-black border-rose-400' : 'bg-black/40 text-gray-500 hover:text-white border-gray-800'"
                         class="py-3 rounded-xl text-[9px] uppercase font-black transition-all border disabled:opacity-30">
                          Stream Mix
                       </button>
                       <button (click)="onSetAudio('none')" [disabled]="vm.recording" [class]="vm.audioSource === 'none' ? 'bg-rose-500 text-rose-950 font-black border-rose-400' : 'bg-black/40 text-gray-500 hover:text-white border-gray-800'"
                         class="py-3 rounded-xl text-[9px] uppercase font-black transition-all border disabled:opacity-30">
                          Mute Sink
                       </button>
                    </div>
                 </div>

                 <!-- Resolution Selection -->
                 <div>
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 leading-none italic opacity-60">Temporal Resolution Grid</label>
                    <div class="grid grid-cols-3 gap-2">
                       <button (click)="onSetRes('1080p')" [disabled]="vm.recording" [class]="vm.resolution === '1080p' ? 'bg-rose-500 text-rose-950 font-black border-rose-400' : 'bg-black/40 text-gray-500 hover:text-white border-gray-800'"
                         class="py-3 rounded-xl text-[9px] uppercase font-black transition-all border disabled:opacity-30 text-center">1080P</button>
                       <button (click)="onSetRes('720p')" [disabled]="vm.recording" [class]="vm.resolution === '720p' ? 'bg-rose-500 text-rose-950 font-black border-rose-400' : 'bg-black/40 text-gray-500 hover:text-white border-gray-800'"
                         class="py-3 rounded-xl text-[9px] uppercase font-black transition-all border disabled:opacity-30 text-center">720P</button>
                       <button (click)="onSetRes('480p')" [disabled]="vm.recording" [class]="vm.resolution === '480p' ? 'bg-rose-500 text-rose-950 font-black border-rose-400' : 'bg-black/40 text-gray-500 hover:text-white border-gray-800'"
                         class="py-3 rounded-xl text-[9px] uppercase font-black transition-all border disabled:opacity-30 text-center">480P</button>
                    </div>
                 </div>

                 <!-- Output Format -->
                 <div class="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-gray-800">
                    <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest">Output Format</span>
                    <div class="flex gap-2">
                       <button (click)="onSetFormat('mp4')" [disabled]="vm.recording" [class]="vm.outputFormat === 'mp4' ? 'text-rose-400 font-black' : 'text-gray-700'" class="text-[10px] uppercase font-mono transition-colors disabled:opacity-20 uppercase">MP4</button>
                       <span class="text-gray-800">|</span>
                       <button (click)="onSetFormat('webm')" [disabled]="vm.recording" [class]="vm.outputFormat === 'webm' ? 'text-rose-400 font-black' : 'text-gray-700'" class="text-[10px] uppercase font-mono transition-colors disabled:opacity-20 uppercase">WEBM</button>
                    </div>
                 </div>

                 <!-- Main Actions -->
                 <div class="pt-4 border-t border-gray-800/50 flex flex-col gap-3">
                    @if (vm.status === 'idle' || vm.status === 'error') {
                       @if (!vm.recording) {
                          <button (click)="onStart()"
                            class="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:opacity-90 text-white font-black py-4 rounded-2xl shadow-xl shadow-rose-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                            <div class="w-3 h-3 rounded-full bg-white animate-pulse"></div>
                            Initialize Capture
                          </button>
                       } @else {
                          <div class="flex gap-2">
                             <button (click)="onTogglePause(vm)"
                               class="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-black py-4 rounded-2xl transition-all active:scale-95 text-xs uppercase tracking-widest">
                               {{ vm.paused ? 'Resume' : 'Pause' }}
                             </button>
                             <button (click)="onStop()"
                               class="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-rose-900/40 transition-all active:scale-95 text-xs uppercase tracking-widest">
                               Terminate
                             </button>
                          </div>
                       }
                    }

                    @if (vm.status === 'success' && vm.outputBlob) {
                       <button (click)="onDownload(vm)" 
                         class="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                         Export Stream
                       </button>
                    }

                    @if (vm.status === 'processing') {
                       <div class="h-14 w-full bg-gray-800/20 rounded-2xl flex items-center justify-center border border-dashed border-gray-800 opacity-50">
                          <span class="text-[10px] font-mono text-gray-600 uppercase tracking-widest animate-pulse">Finalizing Stream Dictionary...</span>
                       </div>
                    }

                    @if (vm.status === 'error') {
                       <div class="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[9px] font-mono text-rose-400 leading-relaxed uppercase" [@fadeIn]>
                          Hardware_Cap_Rejection: {{ vm.errorMessage || 'Unknown stream termination' }}
                       </div>
                    }
                 </div>
              </div>
            </div>
        </div>
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
export class ScreenRecorderComponent implements OnDestroy {
  private store = inject(Store);
  private captisService = inject(ScreenRecorderService);
  private subscription = new Subscription();
  
  readonly vm$ = this.store.select(selectScreenRecorderState);
  private recorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private tickSub: Subscription | null = null;

  onSetAudio(source: any): void { this.store.dispatch(ScreenRecorderActions.setAudioSource({ audioSource: source })); }
  onSetRes(res: any): void { this.store.dispatch(ScreenRecorderActions.setResolution({ resolution: res })); }
  onSetFormat(format: any): void { this.store.dispatch(ScreenRecorderActions.setOutputFormat({ outputFormat: format })); }

  async onStart(): Promise<void> {
    const config = (await new Promise(r => this.vm$.subscribe(r).unsubscribe())) as ScreenRecorderState;
    try {
      const stream = await this.captisService.requestCapture({
        audioSource: config.audioSource,
        resolution: config.resolution,
        outputFormat: config.outputFormat
      });

      this.recorder = this.captisService.buildRecorder(stream, config.resolution);
      this.recordedChunks = [];

      this.recorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.recordedChunks.push(e.data);
      };

      this.recorder.onstop = () => {
        const rawBlob = new Blob(this.recordedChunks, { type: 'video/webm' });
        this.processRecording(rawBlob, config.outputFormat);
        stream.getTracks().forEach(t => t.stop());
      };

      this.recorder.start();
      this.store.dispatch(ScreenRecorderActions.startRecording());
      
      this.tickSub = interval(1000).subscribe(() => {
        this.store.dispatch(ScreenRecorderActions.tickElapsed());
      });

    } catch (err: any) {
      this.store.dispatch(ScreenRecorderActions.processingFailure({ 
        errorCode: 'MEDIA_RECORDER_FAILED', 
        message: err.message || 'Stream capture rejected by hardware layer.',
        retryable: true
      }));
    }
  }

  onTogglePause(vm: ScreenRecorderState): void {
    if (!this.recorder) return;
    if (vm.paused) {
      this.recorder.resume();
      this.store.dispatch(ScreenRecorderActions.resumeRecording());
    } else {
      this.recorder.pause();
      this.store.dispatch(ScreenRecorderActions.pauseRecording());
    }
  }

  onStop(): void {
    this.recorder?.stop();
    this.tickSub?.unsubscribe();
    this.store.dispatch(ScreenRecorderActions.stopRecording());
  }

  private processRecording(blob: Blob, format: 'mp4' | 'webm'): void {
    if (format === 'webm') {
      this.store.dispatch(ScreenRecorderActions.processingSuccess({
        outputBlob: blob,
        outputSizeMB: blob.size / (1024 * 1024)
      }));
      return;
    }

    this.store.dispatch(ScreenRecorderActions.recordingCaptured({ rawBlob: blob }));
    this.subscription.add(
      this.captisService.convertToMp4(blob).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') {
            this.store.dispatch(ScreenRecorderActions.updateProgress({ progress: msg.value ?? 0 }));
          } else if (msg.type === 'complete') {
            const outBlob = new Blob([msg.data as ArrayBuffer], { type: 'video/mp4' });
            this.store.dispatch(ScreenRecorderActions.processingSuccess({
              outputBlob: outBlob,
              outputSizeMB: outBlob.size / (1024 * 1024)
            }));
          }
        },
        error: (err) => {
          this.store.dispatch(ScreenRecorderActions.processingFailure({
            errorCode: 'FFMPEG_COMMAND_FAILED',
            message: 'Temporal re-encoding failed.',
            retryable: true
          }));
        }
      })
    );
  }

  onDownload(state: ScreenRecorderState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const filename = this.captisService.getOutputFilename(state.outputFormat);
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  formatTime(s: number): string {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  onReset(): void {
    this.store.dispatch(ScreenRecorderActions.resetState());
  }

  ngOnDestroy(): void {
    this.recorder?.stop();
    this.tickSub?.unsubscribe();
    this.subscription.unsubscribe();
  }
}