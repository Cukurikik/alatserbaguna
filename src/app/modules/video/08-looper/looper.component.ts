import { fadeIn, slideUp, slideInRight, popIn, staggerFade, buttonState } from '../../../shared/animations';
import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { LooperActions, selectLooperState, LooperState } from './looper.store';
import { LooperService } from './looper.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-looper',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Portal Engine
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Infinity Engine: Perfect Continuity v1.0</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.inputFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-cyan-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-cyan-950/30 transition-colors">
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
               <div class="p-8 rounded-[2.5rem] bg-gray-900/40 border border-gray-800 backdrop-blur-md flex items-start gap-6 group hover:border-cyan-500/30 transition-all duration-500">
                  <div class="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-xl shadow-cyan-500/5">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-black text-sm uppercase tracking-tight italic">Seamless Recursion</h4>
                    <p class="text-[10px] text-gray-500 mt-2 leading-relaxed font-medium uppercase tracking-widest opacity-60 italic">High-speed Concat protocol clones video streams without re-encoding, potentially maintaining 100% source quality.</p>
                  </div>
               </div>
               <div class="p-8 rounded-[2.5rem] bg-gray-900/40 border border-gray-800 backdrop-blur-md flex items-start gap-6 group hover:border-indigo-500/30 transition-all duration-500">
                  <div class="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform shadow-xl shadow-indigo-500/5">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-black text-sm uppercase tracking-tight italic">Smart Transitions</h4>
                    <p class="text-[10px] text-gray-400 mt-2 leading-relaxed font-medium uppercase tracking-widest opacity-60 italic">Optional crossfade logic blends loop points to remove visual jumps in non-seamless sources automagically.</p>
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
                      <app-progress-ring [progress]="vm.progress" [status]="'ITERATING'"></app-progress-ring>
                      <div class="mt-8 flex flex-col items-center gap-2">
                         <span class="text-cyan-400 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse italic font-black">Portal_Core_Warping</span>
                         <span class="text-gray-500 font-mono text-[8px] uppercase tracking-widest opacity-60 italic">Segment {{ (vm.progress / (100/vm.loopCount) + 1) | number:'1.0-0' }} of {{ vm.loopCount }}</span>
                      </div>
                   </div>
                }
              </div>

              <!-- Loop Visualization Lane -->
              <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden h-40 flex items-center">
                 <div class="flex gap-3 w-full overflow-hidden px-2">
                    @for (i of [].constructor(vm.loopCount); track $index) {
                       <div class="h-20 flex-1 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 relative group transition-all hover:bg-cyan-500/10 flex items-center justify-center overflow-hidden" [@slideUp]>
                          <span class="text-[10px] font-black text-cyan-500/40 font-mono italic">#{{ $index + 1 }}</span>
                          @if ($index < vm.loopCount - 1 && vm.crossfade) {
                             <div class="absolute -right-3 top-0 bottom-0 w-6 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent z-10 pointer-events-none"></div>
                          }
                          <div class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       </div>
                    }
                 </div>
                 <div class="absolute bottom-6 left-10 right-10 flex justify-between">
                    <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest italic opacity-40">Temporal_Start</span>
                    <span class="text-[9px] font-black text-cyan-500 uppercase tracking-[0.3em] font-mono italic">Infinity_Chain: {{ (vm.videoMeta?.duration || 0) * vm.loopCount | number:'1.2-2' }}s Estimated</span>
                    <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest italic opacity-40">Temporal_End</span>
                 </div>
              </div>
            </div>

            <div class="w-full lg:w-[420px] shrink-0 flex flex-col gap-8">
              
              <!-- Settings Panel -->
              <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-[2.5rem] p-10 flex flex-col gap-10 shadow-2xl relative overflow-hidden">
                 <div class="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
                 
                 <!-- Iteration Control -->
                 <div class="p-8 bg-black/40 rounded-[2rem] border border-gray-800 shadow-xl group hover:border-cyan-500/20 transition-colors duration-500">
                    <div class="flex justify-between items-center mb-6">
                       <label class="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] italic opacity-60">Loop_Iterations</label>
                       <div class="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl shadow-inner">
                          <span class="text-cyan-400 font-mono text-xl font-black leading-none italic">{{ vm.loopCount }}x</span>
                       </div>
                    </div>
                    
                    <div class="flex items-center gap-6">
                       <button (click)="onSetLoops(vm.loopCount - 1)" [disabled]="vm.loopCount <= 2"
                         class="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white disabled:opacity-10 hover:bg-gray-800 transition-all active:scale-90 shadow-lg">
                         <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4"/></svg>
                       </button>
                       <div class="flex-1 h-1.5 bg-gray-800 rounded-full relative overflow-hidden shadow-inner font-black italic uppercase">
                          <div class="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" [style.width]="(vm.loopCount / 20 * 100) + '%'"></div>
                       </div>
                       <button (click)="onSetLoops(vm.loopCount + 1)" [disabled]="vm.loopCount >= 20"
                         class="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white disabled:opacity-10 hover:bg-gray-800 transition-all active:scale-90 shadow-lg">
                         <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                       </button>
                    </div>
                 </div>

                 <!-- Crossfade Control -->
                 <div class="p-8 bg-black/40 rounded-[2rem] border border-gray-800 shadow-xl group hover:border-cyan-500/20 transition-colors duration-500">
                    <div class="flex items-center justify-between mb-4">
                       <label class="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] italic opacity-60">Smart_Crossfade</label>
                       <button (click)="onToggleCrossfade(!vm.crossfade)" 
                         [class]="vm.crossfade ? 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-gray-800'"
                         class="w-14 h-7 rounded-full relative transition-all duration-300 border border-white/5">
                         <div [class]="vm.crossfade ? 'translate-x-7' : 'translate-x-1'"
                           class="absolute top-1 left-0 w-5 h-5 rounded-full bg-white shadow-lg transition-transform duration-300"></div>
                       </button>
                    </div>
                    
                    @if (vm.crossfade) {
                       <div class="mt-6 pt-6 border-t border-gray-800/50" [@slideUp]>
                          <div class="flex justify-between items-center text-[9px] font-black text-white uppercase mb-4 italic opacity-60 tracking-widest">
                             <span>Overlap_Duration</span>
                             <span class="text-cyan-400 font-mono">{{ vm.crossfadeDuration | number:'1.1-1' }}s</span>
                          </div>
                          <input type="range" min="0.1" max="2" step="0.1" [value]="vm.crossfadeDuration" 
                            (input)="onSetCrossfadeDuration($event)"
                            class="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 focus:outline-none shadow-inner">
                       </div>
                    } @else {
                       <p class="text-[8px] text-gray-600 uppercase font-black italic tracking-widest leading-relaxed opacity-40">Direct Concat protocol active. Optimal for seamless source material.</p>
                    }
                 </div>

                 <!-- Action Button Area -->
                 <div class="pt-6 border-t border-gray-800/50">
                    @if (vm.status === 'idle' || vm.status === 'error') {
                       <button (click)="onStartLoop(vm)"
                         class="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 hover:opacity-90 text-white font-black py-5 rounded-2xl shadow-2xl shadow-cyan-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.25em] flex items-center justify-center gap-4 italic">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                         Generate Recursion
                       </button>
                    } @else if (vm.status === 'success') {
                       <div class="space-y-4" [@slideUp]>
                          <button (click)="onDownload(vm)" 
                            class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 group italic">
                            <svg class="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Export Infinity Stream
                          </button>
                          @if (vm.outputSizeMB) {
                            <p class="text-center text-[9px] font-black font-mono text-emerald-500/60 uppercase tracking-[0.3em] italic">Density_Verified: {{ vm.outputSizeMB | number:'1.2-2' }} MB</p>
                          }
                       </div>
                    } @else {
                       <div class="h-16 w-full bg-gray-950/40 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-800/50 opacity-40">
                          <span class="text-[10px] font-black font-mono text-gray-500 uppercase tracking-[0.4em] animate-pulse italic">Allocating_VFS_Nodes...</span>
                       </div>
                    }

                    @if (vm.status === 'error') {
                       <div class="mt-6 p-6 bg-rose-500/5 border border-rose-500/20 rounded-[1.5rem] flex items-start gap-4 animate-in shake-1 duration-500" [@fadeIn]>
                          <div class="w-10 h-10 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 shrink-0 shadow-lg">
                             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                          </div>
                          <div class="flex-1 min-w-0">
                            <p class="text-white font-black text-xs uppercase tracking-tight italic">Recursion_Engine_Fault</p>
                            <p class="text-rose-400 font-black font-mono text-[9px] mt-1.5 leading-relaxed uppercase tracking-wider opacity-80 italic line-clamp-2">{{ vm.errorMessage || 'Unknown temporal loop corruption' }}</p>
                            @if (vm.retryable) {
                               <button (click)="onStartLoop(vm)" class="mt-4 text-[9px] font-black uppercase text-white border-b-2 border-white/10 hover:border-cyan-500 transition-all hover:text-cyan-400 tracking-[0.2em] italic">Retry_Attempt_Ops</button>
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
export class LooperComponent implements OnDestroy {
  private store = inject(Store);
  private looperService = inject(LooperService);
  private subscription = new Subscription();
  
  readonly vm$ = this.store.select(selectLooperState);
  videoUrl: string | null = null;

  onFileSelected(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(LooperActions.loadFile({ file }));
  }

  onDurationLoaded(duration: number): void {
    this.store.dispatch(LooperActions.loadMetaSuccess({
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

  onSetLoops(count: number): void {
    this.store.dispatch(LooperActions.setLoopCount({ count: Math.max(2, Math.min(20, count)) }));
  }

  onToggleCrossfade(enabled: boolean): void {
    this.store.dispatch(LooperActions.setCrossfade({ enabled }));
  }

  onSetCrossfadeDuration(event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    this.store.dispatch(LooperActions.setCrossfadeDuration({ duration: val }));
  }

  onStartLoop(state: LooperState): void {
    if (!state.inputFile || !state.videoMeta) return;
    
    this.store.dispatch(LooperActions.startProcessing());
    
    this.subscription.add(
      this.looperService.process({
        file: state.inputFile,
        mode: state.mode,
        loopCount: state.loopCount,
        crossfade: state.crossfade,
        crossfadeDuration: state.crossfadeDuration,
        videoMeta: state.videoMeta
      }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') {
            this.store.dispatch(LooperActions.updateProgress({ progress: msg.value ?? 0 }));
          } else if (msg.type === 'complete') {
            const blob = new Blob([msg.data as BlobPart], { type: 'video/mp4' });
            this.store.dispatch(LooperActions.processingSuccess({ 
              outputBlob: blob,
              outputSizeMB: blob.size / (1024 * 1024)
            }));
          }
        },
        error: (err) => {
          this.store.dispatch(LooperActions.processingFailure({ 
            errorCode: 'FFMPEG_COMMAND_FAILED', 
            message: err.message ?? 'Concatenation failed. Portal temporal loop collapsed.',
            retryable: true
          }));
        }
      })
    );
  }

  onDownload(state: LooperState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const filename = this.looperService.getOutputFilename(state.inputFile?.name || 'video');
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  onReset(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = null;
    this.store.dispatch(LooperActions.resetState());
  }

  ngOnDestroy(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.subscription.unsubscribe();
  }
}