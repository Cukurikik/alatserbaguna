import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { VideoToGifActions, selectVideoToGifState, VideoToGifState, DitherMode } from './video-to-gif.store';
import { VideoToGifService } from './video-to-gif.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-video-to-gif',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-amber-300 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Lumina Engine
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Discrete Palette Synthesis: GIF Matrix v1.0</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.inputFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-orange-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-orange-950/30 transition-colors">
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
               <div class="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Palette Optimization</h4>
                    <p class="text-xs text-gray-500 mt-1">Dual-pass encoding with dynamic 256-color palette mapping. Cinematic quality GIF output at 60fps.</p>
                  </div>
               </div>
               <div class="p-6 rounded-2xl bg-yellow-500/5 border border-yellow-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Spatial Dithering</h4>
                    <p class="text-xs text-gray-500 mt-1">Floyd-Steinberg and Bayer pattern dithering for smooth gradients and shadow depth.</p>
                  </div>
               </div>
            </div>
          </div>
        }

        <!-- Pillar 4: Component Logic Area -->
        @if (vm.inputFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8" [@fadeIn]>
            
            <!-- Left: Preview & Palette Visualizer -->
            <div class="flex-1 flex flex-col gap-6">
              <div class="relative group rounded-3xl overflow-hidden border border-gray-800 shadow-2xl bg-black/40 aspect-video flex-col flex items-center justify-center">
                <app-video-preview [videoUrl]="videoUrl" (durationLoaded)="onDurationLoaded($event)"></app-video-preview>
                
                <!-- GIF Palette Overlay Simulation -->
                <div class="absolute top-6 left-6 grid grid-cols-8 gap-1 p-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/5 z-10">
                   @for (i of [1,2,3,4,5,6,7,8]; track i) {
                      <div class="w-2 h-2 rounded-sm bg-orange-500/40 animate-pulse" [style.animationDelay.ms]="i * 50"></div>
                   }
                </div>

                @if (vm.status === 'processing') {
                   <div class="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-10" [@fadeIn]>
                      <app-progress-ring [progress]="vm.progress" [status]="'MAPPING'"></app-progress-ring>
                      <div class="mt-6 flex flex-col items-center gap-2 text-center px-6">
                         <p class="text-orange-400 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse font-black">Generating Color Dictionary</p>
                         <p class="text-gray-500 font-mono text-[8px] uppercase">Applying Bayer Error Diffusion</p>
                      </div>
                   </div>
                }

                <div class="absolute top-4 right-4 px-3 py-1 bg-orange-500/20 border border-orange-500/40 rounded-lg backdrop-blur-md flex items-center gap-2">
                   <div class="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></div>
                   <span class="text-[9px] font-black text-orange-400 uppercase tracking-widest">Lumina-Input v1.0</span>
                </div>
              </div>

              <!-- Metrics -->
              <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                 <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 font-mono">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Time Slice</span>
                       <span class="text-white text-xs truncate uppercase tracking-tighter">{{ vm.startTime.toFixed(1) }}s » {{ vm.endTime.toFixed(1) }}s</span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono">
                       <span class="text-[9px] font-black text-orange-500/60 uppercase tracking-widest leading-none mb-1">Frame Budget</span>
                       <span class="text-orange-400 text-xs font-black truncate uppercase">
                          {{ vm.fps }} FPS
                       </span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Spatial Width</span>
                       <span class="text-white text-[10px] uppercase font-black tracking-tighter">
                          {{ vm.width }} PX
                       </span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pl-4 font-mono">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Dither Hash</span>
                       <span class="text-gray-400 text-[10px] tracking-tighter">{{ vm.dither }}_v0.9</span>
                    </div>
                 </div>
                 <div class="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-transparent"></div>
              </div>
            </div>

            <!-- Right: Parameters Panel -->
            <div class="w-full lg:w-[420px] flex flex-col gap-6">
              
              <div class="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
                 
                 <!-- Time Range -->
                 <div class="grid grid-cols-2 gap-4">
                    <div class="p-4 bg-black/40 rounded-2xl border border-gray-800 flex flex-col gap-2">
                       <label class="text-[9px] font-black text-gray-600 uppercase tracking-widest">Start_TX</label>
                       <input type="number" [value]="vm.startTime" (input)="onSetStart($event)" class="bg-transparent border-none p-0 text-white font-mono font-black text-xl">
                    </div>
                    <div class="p-4 bg-black/40 rounded-2xl border border-gray-800 flex flex-col gap-2">
                       <label class="text-[9px] font-black text-gray-600 uppercase tracking-widest">End_TX</label>
                       <input type="number" [value]="vm.endTime" (input)="onSetEnd($event)" class="bg-transparent border-none p-0 text-white font-mono font-black text-xl">
                    </div>
                 </div>

                 <!-- FPS & Scale -->
                 <div class="grid grid-cols-2 gap-4">
                    <div>
                       <label class="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 italic opacity-60">Temporal Density</label>
                       <div class="grid grid-cols-3 gap-2">
                          @for (f of [10, 15, 30]; track f) {
                             <button (click)="onSetFPS(f)" [class]="vm.fps === f ? 'bg-orange-500 text-orange-950 font-black border-orange-400' : 'bg-black/40 text-gray-500 border-gray-800'"
                               class="py-2.5 rounded-xl text-[10px] uppercase font-black transition-all border">
                                {{ f }}
                             </button>
                          }
                       </div>
                    </div>
                    <div>
                       <label class="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 italic opacity-60">Spatial Scale</label>
                       <div class="grid grid-cols-2 gap-2">
                          @for (w of [320, 480]; track w) {
                             <button (click)="onSetWidth(w)" [class]="vm.width === w ? 'bg-orange-500 text-orange-950 font-black border-orange-400' : 'bg-black/40 text-gray-500 border-gray-800'"
                               class="py-2.5 rounded-xl text-[10px] uppercase font-black transition-all border">
                                {{ w }}P
                             </button>
                          }
                       </div>
                    </div>
                 </div>

                 <!-- Dither Algorithm -->
                 <div>
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 leading-none italic opacity-60">Matrix Quantization</label>
                    <div class="grid grid-cols-1 gap-2">
                       <button (click)="onSetDither('bayer')" [class]="vm.dither === 'bayer' ? 'bg-orange-500 text-orange-950 font-black border-orange-400' : 'bg-black/40 text-gray-500 hover:text-white border-gray-800'"
                         class="p-4 rounded-xl text-[10px] uppercase font-black transition-all border flex flex-col items-start gap-1">
                          <span>Bayer-8 Pattern</span>
                          <span class="text-[8px] opacity-60 font-medium italic">Standard retro-ordered dithering. Fast.</span>
                       </button>
                       <button (click)="onSetDither('floyd_steinberg')" [class]="vm.dither === 'floyd_steinberg' ? 'bg-orange-500 text-orange-950 font-black border-orange-400' : 'bg-black/40 text-gray-500 hover:text-white border-gray-800'"
                         class="p-4 rounded-xl text-[10px] uppercase font-black transition-all border flex flex-col items-start gap-1">
                          <span>Floyd-Steinberg Diffusion</span>
                          <span class="text-[8px] opacity-60 font-medium italic">High fidelity error diffusion. Smooth.</span>
                       </button>
                    </div>
                 </div>

                 <!-- Action -->
                 <div class="pt-4 border-t border-gray-800/50">
                    @if (vm.status === 'idle' || vm.status === 'error') {
                       <button (click)="onSynthesize(vm)"
                         class="w-full bg-gradient-to-r from-orange-600 to-yellow-600 hover:opacity-90 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                         Start Synthesis
                       </button>
                    } @else if (vm.status === 'success') {
                       <div class="space-y-3" [@slideUp]>
                          <button (click)="onDownload(vm)" 
                            class="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Export Matrix
                          </button>
                          @if (vm.outputSizeMB) {
                            <p class="text-center text-[9px] font-mono text-gray-500 uppercase tracking-widest">Hydrated Volume: {{ vm.outputSizeMB.toFixed(2) }} MB</p>
                          }
                       </div>
                    } @else {
                       <div class="h-14 w-full bg-gray-800/20 rounded-2xl flex items-center justify-center border border-dashed border-gray-800 opacity-50">
                          <span class="text-[10px] font-mono text-gray-600 uppercase tracking-widest animate-pulse">Quantizing Pixels...</span>
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
export class VideoToGifComponent implements OnDestroy {
  private store = inject(Store);
  private luminaService = inject(VideoToGifService);
  private subscription = new Subscription();
  
  readonly vm$ = this.store.select(selectVideoToGifState);
  videoUrl: string | null = null;

  onFileSelected(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(VideoToGifActions.loadFile({ file }));
  }

  onDurationLoaded(duration: number): void {
    this.store.dispatch(VideoToGifActions.loadMetaSuccess({
      meta: {
        filename: 'video', fileSizeMB: 0, duration,
        width: 1280, height: 720, fps: 30, codec: 'h264',
        audioCodec: 'aac', audioBitrate: 128, videoBitrate: 0,
        hasAudio: true, aspectRatio: '16:9',
      }
    }));
  }

  onSetStart(e: Event): void { this.store.dispatch(VideoToGifActions.setStartTime({ time: parseFloat((e.target as HTMLInputElement).value) })); }
  onSetEnd(e: Event): void { this.store.dispatch(VideoToGifActions.setEndTime({ time: parseFloat((e.target as HTMLInputElement).value) })); }
  onSetFPS(fps: number): void { this.store.dispatch(VideoToGifActions.setFps({ fps })); }
  onSetWidth(width: number): void { this.store.dispatch(VideoToGifActions.setWidth({ width })); }
  onSetDither(dither: any): void { this.store.dispatch(VideoToGifActions.setDither({ dither })); }

  onSynthesize(state: VideoToGifState): void {
    if (!state.inputFile) return;
    
    this.store.dispatch(VideoToGifActions.startProcessing());
    
    this.subscription.add(
      this.luminaService.process({
        file: state.inputFile,
        startTime: state.startTime,
        endTime: state.endTime,
        fps: state.fps,
        width: state.width,
        dither: state.dither as any
      }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') {
            this.store.dispatch(VideoToGifActions.updateProgress({ progress: msg.value ?? 0 }));
          } else if (msg.type === 'complete') {
            const blob = new Blob([msg.data as BlobPart], { type: 'image/gif' });
            this.store.dispatch(VideoToGifActions.processingSuccess({ 
              outputBlob: blob,
              outputSizeMB: blob.size / (1024 * 1024)
            }));
          }
        },
        error: (err) => {
          this.store.dispatch(VideoToGifActions.processingFailure({ 
            errorCode: 'FFMPEG_COMMAND_FAILED', 
            message: err.message ?? 'Palette synthesis kernel calculation aborted.',
            retryable: true
          }));
        }
      })
    );
  }

  onDownload(state: VideoToGifState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const filename = this.luminaService.getOutputFilename(state.inputFile?.name || 'video');
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  onReset(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = null;
    this.store.dispatch(VideoToGifActions.resetState());
  }

  ngOnDestroy(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.subscription.unsubscribe();
  }
}