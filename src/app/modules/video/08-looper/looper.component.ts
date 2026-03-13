import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
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
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Video Looper
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Infinity Engine: Perfect Continuity</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.inputFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-cyan-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-cyan-950/30 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </span>
              Erase
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
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Seamless Recursion</h4>
                    <p class="text-xs text-gray-500 mt-1">High-speed Concat protocol clones video streams without re-encoding, preserving 100% source quality.</p>
                  </div>
               </div>
               <div class="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Smart Transitions</h4>
                    <p class="text-xs text-gray-500 mt-1">Optional crossfade logic blends loop points to remove visual jumps in non-seamless sources.</p>
                  </div>
               </div>
            </div>
          </div>
        }

        <!-- Pillar 4: Component Logic Area -->
        @if (vm.inputFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8" [@fadeIn]>
            
            <!-- Left: Preview & Loop Visualizer -->
            <div class="flex-1 flex flex-col gap-6">
              <div class="relative group rounded-3xl overflow-hidden border border-gray-800 shadow-2xl bg-black/40 aspect-video flex items-center justify-center">
                <app-video-preview [videoUrl]="videoUrl" (durationLoaded)="onDurationLoaded($event)"></app-video-preview>
                
                @if (vm.status === 'processing') {
                   <div class="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-10" [@fadeIn]>
                      <app-progress-ring [progress]="vm.progress" [status]="'CLONING'"></app-progress-ring>
                      <div class="mt-6 flex flex-col items-center gap-2">
                         <p class="text-cyan-400 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse font-black">Building Iteration Stream</p>
                         <p class="text-gray-500 font-mono text-[8px] uppercase">Appending Segment {{ (vm.progress / (100/vm.loopCount) + 1).toFixed(0) }} of {{ vm.loopCount }}</p>
                      </div>
                   </div>
                }
              </div>

              <!-- Loop Visualization Lane -->
              <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden h-32 flex items-center">
                 <div class="flex gap-2 w-full overflow-hidden">
                    @for (i of [].constructor(vm.loopCount); track $index) {
                       <div class="h-16 flex-1 rounded-lg border border-cyan-500/20 bg-cyan-500/5 relative group transition-all hover:bg-cyan-500/10 flex items-center justify-center" [@slideUp]>
                          <span class="text-[10px] font-black text-cyan-500/40 font-mono italic">#{{ $index + 1 }}</span>
                          @if ($index < vm.loopCount - 1 && vm.crossfade) {
                             <div class="absolute -right-2 top-0 bottom-0 w-4 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent z-10 pointer-events-none"></div>
                          }
                       </div>
                    }
                 </div>
                 <div class="absolute bottom-4 left-6 right-6 flex justify-between px-2">
                    <span class="text-[9px] font-black text-gray-600 uppercase tracking-tighter">Start</span>
                    <span class="text-[9px] font-black text-cyan-500 uppercase tracking-widest font-mono">Loop Chain: {{ vm.loopCount }} Segments</span>
                    <span class="text-[9px] font-black text-gray-600 uppercase tracking-tighter">{{ (vm.videoMeta?.duration || 0) * vm.loopCount }}s Total</span>
                 </div>
              </div>
            </div>

            <!-- Right: Settings Panel -->
            <div class="w-full lg:w-[420px] flex flex-col gap-6">
              
              <!-- Parameters Card -->
              <div class="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden">
                 
                 <!-- Iteration Control -->
                 <div>
                    <div class="flex justify-between items-center mb-6">
                       <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest">Loop Repetitions</label>
                       <span class="text-2xl font-black text-cyan-400 font-mono tracking-tighter">{{ vm.loopCount }}x</span>
                    </div>
                    
                    <div class="flex items-center gap-4">
                       <button (click)="onSetLoops(vm.loopCount - 1)" [disabled]="vm.loopCount <= 2"
                         class="w-14 h-14 rounded-2xl bg-black/40 border border-gray-800 flex items-center justify-center text-white disabled:opacity-20 hover:bg-gray-800 transition-colors">
                         <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/></svg>
                       </button>
                       <div class="flex-1 h-2 bg-gray-800 rounded-full relative overflow-hidden">
                          <div class="h-full bg-cyan-500" [style.width]="(vm.loopCount / 20 * 100) + '%'"></div>
                       </div>
                       <button (click)="onSetLoops(vm.loopCount + 1)" [disabled]="vm.loopCount >= 20"
                         class="w-14 h-14 rounded-2xl bg-black/40 border border-gray-800 flex items-center justify-center text-white disabled:opacity-20 hover:bg-gray-800 transition-colors">
                         <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                       </button>
                    </div>
                    <p class="text-[8px] text-gray-600 mt-4 uppercase tracking-tighter text-center">Support for up to 20 consecutive iterations (High Entropy Limit)</p>
                 </div>

                 <!-- Crossfade Control -->
                 <div class="p-6 bg-black/30 rounded-2xl border border-gray-800/50">
                    <div class="flex items-center justify-between mb-4">
                       <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Smart Crossfade</label>
                       <button (click)="onToggleCrossfade(!vm.crossfade)" 
                         [class]="vm.crossfade ? 'bg-cyan-500' : 'bg-gray-800'"
                         class="w-10 h-5 rounded-full relative transition-colors duration-200">
                         <div [class]="vm.crossfade ? 'translate-x-5' : 'translate-x-1'"
                           class="absolute top-1 left-0 w-3 h-3 rounded-full bg-white transition-transform duration-200"></div>
                       </button>
                    </div>
                    
                    @if (vm.crossfade) {
                       <div class="mt-4 pt-4 border-t border-gray-800/50" [@slideUp]>
                          <div class="flex justify-between items-center text-[9px] font-black text-gray-500 uppercase mb-3">
                             <span>Overlap Duration</span>
                             <span class="text-cyan-400 font-mono">{{ vm.crossfadeDuration }}s</span>
                          </div>
                          <input type="range" min="0.1" max="2" step="0.1" [value]="vm.crossfadeDuration" 
                            (input)="onSetCrossfadeDuration($event)"
                            class="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500">
                       </div>
                    } @else {
                       <p class="text-[8px] text-gray-700 uppercase leading-relaxed italic">Direct Concat mode active. Recommended for videos with same start/end frame (Gifs/Loops).</p>
                    }
                 </div>

                 <!-- Action Button Area -->
                 <div class="pt-4 border-t border-gray-800/50">
                    @if (vm.status === 'idle' || vm.status === 'error') {
                       <button (click)="onStartLoop(vm)"
                         class="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-black py-4 rounded-2xl shadow-xl shadow-cyan-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                         Generate Recursion
                       </button>
                    } @else if (vm.status === 'success') {
                       <div class="space-y-3" [@slideUp]>
                          <button (click)="onDownload(vm)" 
                            class="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Export Infinity Stream
                          </button>
                          @if (vm.outputSizeMB) {
                            <p class="text-center text-[9px] font-mono text-gray-500 uppercase tracking-widest">Recursive Volume: {{ vm.outputSizeMB.toFixed(2) }} MB</p>
                          }
                       </div>
                    } @else {
                       <div class="h-14 w-full bg-gray-800/20 rounded-2xl flex items-center justify-center border border-dashed border-gray-800 opacity-50">
                          <span class="text-[10px] font-mono text-gray-600 uppercase tracking-widest animate-pulse">Allocating Concat VFS...</span>
                       </div>
                    }

                    @if (vm.status === 'error') {
                       <div class="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4" [@fadeIn]>
                          <svg class="w-5 h-5 text-rose-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                          <div class="flex-1">
                            <p class="text-white font-black text-xs uppercase tracking-tight">Looping Core Breakdown</p>
                            <p class="text-rose-400 font-mono text-[9px] mt-1 pr-2 leading-relaxed opacity-80">{{ vm.errorMessage || 'Temporal discontinuity detected' }}</p>
                            @if (vm.retryable) {
                               <button (click)="onStartLoop(vm)" class="mt-4 text-[10px] font-black uppercase text-white bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-full border border-white/10 transition-all">Retry Concatenation</button>
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
            message: err.message ?? 'Concatenation thread exhausted. Check source container.',
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
    this.store.dispatch(LooperActions.resetState());
  }

  ngOnDestroy(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.subscription.unsubscribe();
  }
}