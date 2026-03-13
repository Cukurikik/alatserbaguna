import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { StabilizerActions, selectStabilizerState, StabilizerState } from './stabilizer.store';
import { StabilizerService } from './stabilizer.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-stabilizer',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-indigo-400 via-violet-500 to-purple-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Video Stabilizer
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">VidStab Two-Pass Motion Logic</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.inputFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-rose-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-rose-950/30 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </span>
              Discard
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
               <div class="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Motion Analysis</h4>
                    <p class="text-xs text-gray-500 mt-1">First pass detects camera translation, rotation, and zoom to build a stabilization transformation data file.</p>
                  </div>
               </div>
               <div class="p-6 rounded-2xl bg-violet-500/5 border border-violet-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Frame Reconstruction</h4>
                    <p class="text-xs text-gray-500 mt-1">Second pass applies smoothing filters to eliminate jitter while keeping natural camera movement intended by the user.</p>
                  </div>
               </div>
            </div>
          </div>
        }

        <!-- Pillar 4: Component Logic Area -->
        @if (vm.inputFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8" [@fadeIn]>
            
            <!-- Left: Video Preview -->
            <div class="flex-1 flex flex-col gap-6">
              <div class="relative group rounded-3xl overflow-hidden border border-gray-800 shadow-2xl bg-black/40 aspect-video flex items-center justify-center">
                <app-video-preview [videoUrl]="videoUrl" (durationLoaded)="onDurationLoaded($event)"></app-video-preview>
                
                @if (vm.status === 'processing') {
                   <div class="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-10" [@fadeIn]>
                      <app-progress-ring [progress]="vm.progress" [status]="'STABILIZING'"></app-progress-ring>
                      <div class="mt-6 flex flex-col items-center gap-2">
                         <p class="text-indigo-400 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse">Running Two-Pass Filter Chain</p>
                         <p class="text-gray-500 font-mono text-[8px] uppercase">Detecting Motion Vectors...</p>
                      </div>
                   </div>
                }
              </div>

              <!-- Technical Stats -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div class="bg-gray-900/40 p-5 rounded-2xl border border-gray-800 flex flex-col gap-1 shadow-lg">
                    <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none">Source Buffer</span>
                    <span class="text-white font-mono text-sm tracking-tighter truncate">{{ vm.inputFile.name }}</span>
                 </div>
                 <div class="bg-gray-900/40 p-5 rounded-2xl border border-gray-800 flex flex-col gap-1 shadow-lg">
                    <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none">Spatial Grid</span>
                    <span class="text-white font-mono text-sm tracking-tighter">{{ vm.videoMeta?.width || '–' }}×{{ vm.videoMeta?.height || '–' }}</span>
                 </div>
                 <div class="bg-gray-900/40 p-5 rounded-2xl border border-gray-800 flex flex-col gap-1 shadow-lg">
                    <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none">Temporal Length</span>
                    <span class="text-white font-mono text-sm tracking-tighter">{{ vm.videoMeta?.duration?.toFixed(2) || '–' }}s</span>
                 </div>
                 <div class="bg-gray-900/40 p-5 rounded-2xl border border-gray-800 flex flex-col gap-1 shadow-lg">
                    <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none">Data Volume</span>
                    <span class="text-white font-mono text-sm tracking-tighter">{{ (vm.inputFile.size / (1024*1024)).toFixed(2) }} MB</span>
                 </div>
              </div>
            </div>

            <!-- Right: Logic Panel -->
            <div class="w-full lg:w-[420px] flex flex-col gap-6">
              
              <!-- Stabilization Settings -->
              <div class="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden">
                 <div class="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] rounded-full -mr-10 -mt-10"></div>
                 
                 <!-- Smoothing Control -->
                 <div class="p-6 bg-black/30 rounded-2xl border border-gray-800/50 relative z-10">
                    <div class="flex justify-between items-center mb-6">
                      <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Smoothing Amplitude</label>
                      <div class="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-md">
                         <span class="text-indigo-400 font-mono text-xs font-bold leading-none">{{ vm.smoothing }}</span>
                      </div>
                    </div>
                    <input type="range" min="1" max="50" [value]="vm.smoothing" (input)="onSetSmoothing($event)"
                      class="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none">
                    <div class="flex justify-between mt-4">
                      <div class="flex flex-col gap-0.5">
                         <span class="text-[9px] font-bold text-gray-600 uppercase tracking-tighter leading-none">Natural</span>
                         <span class="text-[7px] text-gray-700 uppercase">Low Correction</span>
                      </div>
                      <div class="flex flex-col gap-0.5 items-end">
                         <span class="text-[9px] font-bold text-gray-600 uppercase tracking-tighter leading-none">Fixed Axis</span>
                         <span class="text-[7px] text-gray-700 uppercase">Aggressive Stabilization</span>
                      </div>
                    </div>
                 </div>

                 <!-- Transformation Info -->
                 <div class="p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 flex items-start gap-4">
                    <div class="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                       <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    <div>
                       <p class="text-[10px] font-black text-white uppercase tracking-tight">Algorithmic Crop</p>
                       <p class="text-[9px] text-gray-500 mt-1 leading-relaxed">Stabilization requires slight zooming to compensate for frame movement. Higher smoothing results in more cropping.</p>
                    </div>
                 </div>

                 <!-- Action Button Area -->
                 <div class="pt-4 border-t border-gray-800/50 relative z-10">
                    @if (vm.status === 'idle' || vm.status === 'error') {
                       <button (click)="onStartStabilize(vm)"
                         class="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                         Initiate Stabilizer
                       </button>
                    } @else if (vm.status === 'success') {
                       <div class="space-y-3" [@slideUp]>
                          <button (click)="onDownload(vm)" 
                            class="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Save Rendered Output
                          </button>
                          @if (vm.outputSizeMB) {
                            <p class="text-center text-[9px] font-mono text-gray-500 uppercase tracking-widest">Rendered Asset Volume: {{ vm.outputSizeMB.toFixed(2) }} MB</p>
                          }
                       </div>
                    } @else {
                       <div class="h-14 w-full bg-gray-800/20 rounded-2xl flex items-center justify-center border border-dashed border-gray-800 opacity-50">
                          <span class="text-[10px] font-mono text-gray-600 uppercase tracking-widest animate-pulse">Initializing Virtual Worker Thread...</span>
                       </div>
                    }

                    @if (vm.status === 'error') {
                       <div class="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4" [@fadeIn]>
                          <svg class="w-5 h-5 text-rose-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                          <div class="flex-1">
                            <p class="text-white font-black text-xs uppercase leading-tight tracking-tight">VidStab Engine failure</p>
                            <p class="text-rose-400 font-mono text-[9px] mt-1 pr-2 leading-relaxed opacity-80">{{ vm.errorMessage || 'Motion detection failure' }}</p>
                            @if (vm.retryable) {
                               <button (click)="onStartStabilize(vm)" class="mt-4 text-[10px] font-black uppercase text-white bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-full border border-white/10 transition-all">Retry Pipeline</button>
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
export class StabilizerComponent implements OnDestroy {
  private store = inject(Store);
  private stabilizerService = inject(StabilizerService);
  private subscription = new Subscription();
  
  readonly vm$ = this.store.select(selectStabilizerState);
  videoUrl: string | null = null;

  onFileSelected(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(StabilizerActions.loadFile({ file }));
  }

  onDurationLoaded(duration: number): void {
    this.store.dispatch(StabilizerActions.loadMetaSuccess({
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

  onSetSmoothing(e: Event): void {
    this.store.dispatch(StabilizerActions.setSmoothing({ smoothing: parseInt((e.target as HTMLInputElement).value) }));
  }

  onStartStabilize(state: StabilizerState): void {
    if (!state.inputFile) return;
    
    this.store.dispatch(StabilizerActions.startProcessing());
    
    this.subscription.add(
      this.stabilizerService.process({
        file: state.inputFile,
        smoothing: state.smoothing
      }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') {
            this.store.dispatch(StabilizerActions.updateProgress({ progress: msg.value ?? 0 }));
          } else if (msg.type === 'complete') {
            const blob = new Blob([msg.data as BlobPart], { type: 'video/mp4' });
            this.store.dispatch(StabilizerActions.processingSuccess({ 
              outputBlob: blob,
              outputSizeMB: blob.size / (1024 * 1024)
            }));
          }
        },
        error: (err) => {
          this.store.dispatch(StabilizerActions.processingFailure({ 
            errorCode: 'FFMPEG_COMMAND_FAILED', 
            message: err.message ?? 'Stabilization logic failed. Ensure the input format is supported.',
            retryable: true
          }));
        }
      })
    );
  }

  onDownload(state: StabilizerState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const filename = this.stabilizerService.getOutputFilename(state.inputFile?.name || 'video');
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
    this.store.dispatch(StabilizerActions.resetState());
  }

  ngOnDestroy(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.subscription.unsubscribe();
  }
}