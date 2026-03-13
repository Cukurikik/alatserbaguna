import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { SplitterActions, selectSplitterState, SplitterState, SplitSegment } from './splitter.store';
import { SplitterService } from './splitter.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-splitter',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-orange-400 via-rose-500 to-amber-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Fracture Engine
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Stream Segmentation: Atomic Slicing v1.0</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.inputFile) {
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
        
        <!-- Pillar 5: I/O — Input State -->
        @if (!vm.inputFile) {
          <div class="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full" [@slideUp]>
            <app-file-drop-zone accept="video/*" (fileDropped)="onFileSelected($event)"></app-file-drop-zone>
            
            <div class="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
               <div class="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758L5 19m0-14l4.121 4.121"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Atomic Segmentation</h4>
                    <p class="text-xs text-gray-500 mt-1">Slicing streams into discrete segments based on markers or equal duration. Zero-loss stream copying.</p>
                  </div>
               </div>
               <div class="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Parallel Fracture</h4>
                    <p class="text-xs text-gray-500 mt-1">Multi-segment extraction logic. Split a long recording into digestible social-ready clips instantly.</p>
                  </div>
               </div>
            </div>
          </div>
        }

        <!-- Pillar 4: Component Logic Area -->
        @if (vm.inputFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8" [@fadeIn]>
            
            <!-- Left: Preview & Fracture Markers -->
            <div class="flex-1 flex flex-col gap-6">
              <div class="relative group rounded-3xl overflow-hidden border border-gray-800 shadow-2xl bg-black/40 aspect-video flex-col flex items-center justify-center">
                <app-video-preview [videoUrl]="videoUrl" (durationLoaded)="onDurationLoaded($event)"></app-video-preview>
                
                <!-- Fracture Visualizer -->
                <div class="absolute inset-x-0 bottom-0 h-2 bg-gray-800/40 backdrop-blur-md overflow-hidden flex z-10">
                   @for (m of vm.markers; track m) {
                      <div [style.left.%]="(m / (vm.videoMeta?.duration || 1)) * 100" class="absolute top-0 bottom-0 w-1 bg-rose-500 shadow-[0_0_10px_#f43f5e]"></div>
                   }
                </div>

                @if (vm.status === 'processing') {
                   <div class="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-10" [@fadeIn]>
                      <app-progress-ring [progress]="vm.progress" [status]="'FRACTURING'"></app-progress-ring>
                      <div class="mt-6 flex flex-col items-center gap-2 text-center px-6">
                         <p class="text-rose-400 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse font-black">Demuxing Atomic Segments</p>
                         <p class="text-gray-500 font-mono text-[8px] uppercase">Re-mapping Packet Timestamps</p>
                      </div>
                   </div>
                }

                <div class="absolute top-4 right-4 px-3 py-1 bg-rose-500/20 border border-rose-500/40 rounded-lg backdrop-blur-md flex items-center gap-2">
                   <div class="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></div>
                   <span class="text-[9px] font-black text-rose-400 uppercase tracking-widest">Fracture-Input v1.0</span>
                </div>
              </div>

              <!-- Stream Dashboard -->
              <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                 <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 font-mono">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Source Stream</span>
                       <span class="text-white text-xs truncate uppercase tracking-tighter">{{ vm.videoMeta?.duration || 0 }}s // {{ vm.videoMeta?.codec }}</span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono">
                       <span class="text-[9px] font-black text-rose-500/60 uppercase tracking-widest leading-none mb-1">Segment Count</span>
                       <span class="text-rose-400 text-xs font-black truncate uppercase">
                          {{ vm.mode === 'markers' ? vm.markers.length + 1 : vm.equalParts }} Segments
                       </span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Slice Logic</span>
                       <span class="text-white text-[10px] uppercase font-black">
                          {{ vm.mode === 'markers' ? 'CUSTOM_ATOMIC' : 'EQUAL_FRACTURE' }}
                       </span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pl-4 font-mono">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Slice Hash</span>
                       <span class="text-gray-400 text-[10px] tracking-tighter">fracture_link_v1.0</span>
                    </div>
                 </div>
                 <div class="absolute inset-0 bg-gradient-to-r from-rose-500/5 via-transparent to-transparent"></div>
              </div>
            </div>

            <!-- Right: Parameters Panel -->
            <div class="w-full lg:w-[420px] flex flex-col gap-6">
              
              <!-- Parameters Card -->
              <div class="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
                 
                 <!-- Fragmentation Logic Selection -->
                 <div>
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 leading-none italic opacity-60">Fragmentation Protocol</label>
                    <div class="grid grid-cols-2 gap-2">
                       <button (click)="onSetMode('markers')" [class]="vm.mode === 'markers' ? 'bg-rose-500 text-rose-950 font-black border-rose-400 shadow-lg shadow-rose-500/20' : 'bg-black/40 text-gray-500 hover:text-white border-gray-800'"
                         class="py-4 rounded-xl text-[10px] uppercase font-black transition-all border flex flex-col items-center gap-1">
                          <span>Atomic Markers</span>
                       </button>
                       <button (click)="onSetMode('equal')" [class]="vm.mode === 'equal' ? 'bg-rose-500 text-rose-950 font-black border-rose-400 shadow-lg shadow-rose-500/20' : 'bg-black/40 text-gray-500 hover:text-white border-gray-800'"
                         class="py-4 rounded-xl text-[10px] uppercase font-black transition-all border flex flex-col items-center gap-1">
                          <span>Equal Slicing</span>
                       </button>
                    </div>
                 </div>

                 <!-- Markers Area -->
                 @if (vm.mode === 'markers') {
                    <div>
                       <div class="flex justify-between items-center mb-4">
                          <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none italic opacity-60">Slice Points (s)</label>
                          <button (click)="onAddMarker()" class="text-[9px] font-black text-rose-400 hover:text-rose-300 uppercase underline transition-colors">Add Cursor</button>
                       </div>
                       <div class="flex flex-wrap gap-2">
                          @for (m of vm.markers; track m) {
                             <div class="bg-black/40 border border-gray-800 rounded-lg px-3 py-1.5 flex items-center gap-2 group hover:border-rose-500/50 transition-colors">
                                <span class="text-[10px] font-mono text-white">{{ m.toFixed(2) }}s</span>
                                <button (click)="onRemoveMarker(m)" class="text-gray-600 hover:text-rose-500 transition-colors">
                                   <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                </button>
                             </div>
                          }
                          @if (vm.markers.length === 0) {
                             <p class="text-[9px] font-mono text-gray-600 italic">No slice points defined...</p>
                          }
                       </div>
                    </div>
                 }

                 <!-- Equal Slice Area -->
                 @if (vm.mode === 'equal') {
                    <div class="p-4 bg-black/40 rounded-2xl border border-gray-800">
                       <div class="flex justify-between items-center mb-3">
                          <label class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none">Part Count</label>
                          <span class="text-[9px] font-mono text-rose-400 font-black">{{ vm.equalParts }} UNITS</span>
                       </div>
                       <input type="range" min="2" max="20" step="1" [value]="vm.equalParts" (input)="onSetEqual($event)"
                         class="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-rose-500">
                    </div>
                 }

                 <!-- Action Area -->
                 <div class="pt-4 border-t border-gray-800/50">
                    @if (vm.status === 'idle' || vm.status === 'error') {
                       <button (click)="onFracture(vm)"
                         class="w-full bg-gradient-to-r from-orange-600 to-rose-600 hover:opacity-90 text-white font-black py-4 rounded-2xl shadow-xl shadow-rose-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758L5 19m0-14l4.121 4.121"/></svg>
                         Start Fracture
                       </button>
                    } @else if (vm.status === 'success') {
                       <div class="space-y-3" [@slideUp]>
                          <button (click)="onBatchDownload(vm)" 
                            class="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Export Atomic Pkg
                          </button>
                          @if (vm.outputBlobs.length > 0) {
                            <p class="text-center text-[9px] font-mono text-gray-500 uppercase tracking-widest">Hydrated Fragments: {{ vm.outputBlobs.length }} FILES</p>
                          }
                       </div>
                    } @else {
                       <div class="h-14 w-full bg-gray-800/20 rounded-2xl flex items-center justify-center border border-dashed border-gray-800 opacity-50">
                          <span class="text-[10px] font-mono text-gray-600 uppercase tracking-widest animate-pulse">De-multiplexing Fragments...</span>
                       </div>
                    }

                    @if (vm.status === 'error') {
                       <div class="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4" [@fadeIn]>
                          <div class="flex-1">
                            <p class="text-white font-black text-xs uppercase tracking-tight">Fragmentation Fault</p>
                            <p class="text-rose-400 font-mono text-[9px] mt-1 pr-2 leading-relaxed opacity-80">{{ vm.errorMessage || 'Unknown atom split rejection' }}</p>
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
export class SplitterComponent implements OnDestroy {
  private store = inject(Store);
  private fractureService = inject(SplitterService);
  private subscription = new Subscription();
  
  readonly vm$ = this.store.select(selectSplitterState);
  videoUrl: string | null = null;
  currentPreviewTime: number = 0;

  onFileSelected(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(SplitterActions.loadFile({ file }));
  }

  onDurationLoaded(duration: number): void {
    this.store.dispatch(SplitterActions.loadMetaSuccess({
      meta: {
        filename: 'video', fileSizeMB: 0, duration,
        width: 1920, height: 1080, fps: 30, codec: 'h264',
        audioCodec: 'aac', audioBitrate: 128, videoBitrate: 0,
        hasAudio: true, aspectRatio: '16:9',
      }
    }));
  }

  onSetMode(mode: 'markers' | 'equal'): void { this.store.dispatch(SplitterActions.setMode({ mode })); }
  onSetEqual(e: Event): void { this.store.dispatch(SplitterActions.setEqualParts({ parts: parseInt((e.target as HTMLInputElement).value, 10) })); }
  
  onAddMarker(): void {
    const video = document.querySelector('video');
    if (video) this.store.dispatch(SplitterActions.addMarker({ time: video.currentTime }));
  }

  onRemoveMarker(time: number): void { this.store.dispatch(SplitterActions.removeMarker({ time })); }

  onFracture(state: SplitterState): void {
    if (!state.inputFile) return;
    
    this.store.dispatch(SplitterActions.startProcessing());
    
    this.subscription.add(
      this.fractureService.process({
        file: state.inputFile,
        mode: state.mode,
        markers: state.markers,
        equalParts: state.equalParts,
        totalDuration: state.videoMeta?.duration || 0
      }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') {
            this.store.dispatch(SplitterActions.updateProgress({ progress: msg.value ?? 0 }));
          } else if (msg.type === 'complete') {
            const buffers = msg.data as ArrayBuffer[];
            const blobs = buffers.map(buf => new Blob([buf], { type: 'video/mp4' }));
            this.store.dispatch(SplitterActions.processingSuccess({ 
              outputBlobs: blobs,
              outputSizeMB: blobs.reduce((acc, b) => acc + b.size, 0) / (1024 * 1024)
            }));
          }
        },
        error: (err) => {
          this.store.dispatch(SplitterActions.processingFailure({ 
            errorCode: 'FFMPEG_COMMAND_FAILED', 
            message: err.message ?? 'Fragmentation kernel calculation aborted.',
            retryable: true
          }));
        }
      })
    );
  }

  onBatchDownload(state: SplitterState): void {
    state.outputBlobs.forEach((blob, idx) => {
      setTimeout(() => {
        const url = URL.createObjectURL(blob);
        const filename = this.fractureService.getOutputFilename(state.inputFile?.name || 'video', idx);
        const a = Object.assign(document.createElement('a'), { href: url, download: filename });
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 150);
      }, idx * 250);
    });
  }

  onReset(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = null;
    this.store.dispatch(SplitterActions.resetState());
  }

  ngOnDestroy(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.subscription.unsubscribe();
  }
}