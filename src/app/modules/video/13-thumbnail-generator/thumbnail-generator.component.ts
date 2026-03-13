import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { ThumbnailGeneratorActions, selectThumbnailGeneratorState, ThumbnailGeneratorState } from './thumbnail-generator.store';
import { ThumbnailGeneratorService } from './thumbnail-generator.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-thumbnail-generator',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Snapshot Engine
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Frame Capture Logic: Neural Extraction</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.inputFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-amber-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-amber-950/30 transition-colors">
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
               <div class="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Frame Decoupling</h4>
                    <p class="text-xs text-gray-500 mt-1">Isolate specific frame buffers from compressed bitstreams at 1:1 pixel accuracy.</p>
                  </div>
               </div>
               <div class="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Multi-Mode Output</h4>
                    <p class="text-xs text-gray-500 mt-1">Generate individual stills, interval-based sequence strips, or composite tile grids.</p>
                  </div>
               </div>
            </div>
          </div>
        }

        <!-- Pillar 4: Component Logic Area -->
        @if (vm.inputFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8" [@fadeIn]>
            
            <!-- Left: Preview & Results Grid -->
            <div class="flex-1 flex flex-col gap-6">
              <div class="relative group rounded-3xl overflow-hidden border border-gray-800 shadow-2xl bg-black/40 aspect-video flex items-center justify-center">
                <app-video-preview [videoUrl]="videoUrl" (durationLoaded)="onDurationLoaded($event)"></app-video-preview>
                
                @if (vm.status === 'processing') {
                   <div class="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-10" [@fadeIn]>
                      <app-progress-ring [progress]="vm.progress" [status]="'EXTRACTING'"></app-progress-ring>
                      <div class="mt-6 flex flex-col items-center gap-2 text-center px-6">
                         <p class="text-amber-400 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse font-black">Scanning Frame Buffers</p>
                         <p class="text-gray-500 font-mono text-[8px] uppercase">Integrating Lanczos Scaling Pipeline</p>
                      </div>
                   </div>
                }

                <div class="absolute top-4 right-4 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-lg backdrop-blur-md flex items-center gap-2">
                   <div class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></div>
                   <span class="text-[9px] font-black text-amber-400 uppercase tracking-widest">Capture v2.5</span>
                </div>
              </div>

              <!-- Captured Snapshots Display -->
              <div class="flex-1 min-h-[300px] bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col gap-4">
                 <div class="flex justify-between items-center mb-2">
                    <h3 class="text-xs font-black text-gray-500 uppercase tracking-[0.2em] italic">Extraction Results</h3>
                    @if (vm.outputBlobs.length > 0) {
                       <span class="text-[9px] font-mono text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {{ vm.outputBlobs.length }} Frames Ready
                       </span>
                    }
                 </div>

                 <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 h-full overflow-y-auto custom-scrollbar pr-2 pb-4">
                    @for (blob of vm.outputBlobs; track $index; let i = $index) {
                       <div class="relative aspect-video rounded-xl overflow-hidden border border-gray-800 group bg-black/60 shadow-lg transition-transform hover:scale-[1.02] cursor-pointer" 
                            (click)="onDownloadSingle(blob, i)" [@slideUp]>
                          <img [src]="getBlobUrl(blob)" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Snapshot {{ i }}">
                          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                             <span class="text-[8px] font-black text-white uppercase truncate">#{{ i + 1 }} · Capture</span>
                          </div>
                          <div class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <div class="w-5 h-5 bg-amber-500 rounded flex items-center justify-center">
                                <svg class="w-3 h-3 text-amber-950" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"/></svg>
                             </div>
                          </div>
                       </div>
                    } @empty {
                       @if (vm.status === 'idle') {
                          <div class="col-span-full h-full flex flex-col items-center justify-center opacity-40 grayscale py-12">
                             <svg class="w-12 h-12 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 112.828 2.828l-7.414 7.414a2 2 0 01-2.828 0L4 16z"/></svg>
                             <p class="text-[10px] uppercase font-black tracking-widest text-gray-500 italic">No Frames Captured</p>
                          </div>
                       }
                    }
                 </div>
                 <div class="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent pointer-events-none"></div>
              </div>
            </div>

            <!-- Right: Parameters Panel -->
            <div class="w-full lg:w-[420px] flex flex-col gap-6">
              
              <!-- Parameters Card -->
              <div class="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
                 
                 <!-- Mode Selector -->
                 <div>
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 leading-none italic opacity-60">Logic Pipeline</label>
                    <div class="grid grid-cols-3 gap-2 p-1.5 bg-black/40 rounded-2xl border border-gray-800">
                       <button (click)="onSetMode('single')" [class]="vm.mode === 'single' ? 'bg-amber-500 text-amber-950 font-black' : 'text-gray-500 hover:text-white'"
                         class="py-3 rounded-xl text-[9px] uppercase font-black transition-all">Single</button>
                       <button (click)="onSetMode('interval')" [class]="vm.mode === 'interval' ? 'bg-amber-500 text-amber-950 font-black' : 'text-gray-500 hover:text-white'"
                         class="py-3 rounded-xl text-[9px] uppercase font-black transition-all">Sequence</button>
                       <button (click)="onSetMode('grid')" [class]="vm.mode === 'grid' ? 'bg-amber-500 text-amber-950 font-black' : 'text-gray-500 hover:text-white'"
                         class="py-3 rounded-xl text-[9px] uppercase font-black transition-all">Grid Map</button>
                    </div>
                 </div>

                 <!-- Contextual Options -->
                 <div class="space-y-6" [@fadeIn]>
                    @if (vm.mode === 'single') {
                       <div class="p-6 bg-black/40 rounded-2xl border border-gray-800">
                          <div class="flex justify-between items-center mb-4">
                             <label class="text-[10px] font-black text-gray-400 uppercase tracking-wide italic opacity-60">Seek Point (s)</label>
                             <span class="text-[10px] font-mono font-black text-amber-400 tracking-tighter">{{ vm.timestamp.toFixed(2) }}s</span>
                          </div>
                          <input type="range" min="0" [max]="getMaxDuration(vm)" step="0.01" [value]="vm.timestamp" (input)="onTimestamp($event)"
                            class="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500">
                       </div>
                    } @else if (vm.mode === 'interval') {
                       <div class="p-6 bg-black/40 rounded-2xl border border-gray-800">
                          <div class="flex justify-between items-center mb-4">
                             <label class="text-[10px] font-black text-gray-400 uppercase tracking-wide italic opacity-60">Sample Gap (s)</label>
                             <span class="text-[10px] font-mono font-black text-amber-400 tracking-tighter">Every {{ vm.intervalSeconds }}s</span>
                          </div>
                          <input type="range" min="1" max="60" step="1" [value]="vm.intervalSeconds" (input)="onInterval($event)"
                            class="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500">
                       </div>
                    } @else {
                       <div class="grid grid-cols-2 gap-4">
                          <div class="p-4 bg-black/40 rounded-2xl border border-gray-800">
                             <label class="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3 block">Grid Cols</label>
                             <input type="number" [value]="vm.gridCols" (input)="onGridCols($event)" class="w-full bg-transparent text-white font-mono font-black text-xs border-b border-gray-800 focus:outline-none focus:border-amber-500 transition-colors">
                          </div>
                          <div class="p-4 bg-black/40 rounded-2xl border border-gray-800">
                             <label class="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3 block">Grid Rows</label>
                             <input type="number" [value]="vm.gridRows" (input)="onGridRows($event)" class="w-full bg-transparent text-white font-mono font-black text-xs border-b border-gray-800 focus:outline-none focus:border-amber-500 transition-colors">
                          </div>
                       </div>
                    }

                    <!-- Format & Quality -->
                    <div class="grid grid-cols-2 gap-4">
                       <div class="p-4 bg-black/40 rounded-2xl border border-gray-800">
                          <label class="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3 block">Matrix Format</label>
                          <select (change)="onFormat($event)" class="w-full bg-transparent text-white font-mono font-black text-[10px] uppercase focus:outline-none cursor-pointer">
                             <option value="jpg" [selected]="vm.imageFormat === 'jpg'">JPG (Optimized)</option>
                             <option value="png" [selected]="vm.imageFormat === 'png'">PNG (Lossless)</option>
                             <option value="webp" [selected]="vm.imageFormat === 'webp'">WebP (NextGen)</option>
                          </select>
                       </div>
                       <div class="p-4 bg-black/40 rounded-2xl border border-gray-800">
                          <label class="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3 block">Compression: {{ vm.jpgQuality }}%</label>
                          <input type="range" min="10" max="100" step="5" [value]="vm.jpgQuality" (input)="onQuality($event)"
                            class="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500">
                       </div>
                    </div>
                 </div>

                 <!-- Action Area -->
                 <div class="pt-4 border-t border-gray-800/50">
                    @if (vm.status === 'idle' || vm.status === 'error') {
                       <button (click)="onExecuteSnapshot(vm)"
                         class="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:opacity-90 text-white font-black py-4 rounded-2xl shadow-xl shadow-amber-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                         Execute Snapshot
                       </button>
                    } @else if (vm.status === 'success') {
                       <div class="space-y-3" [@slideUp]>
                          <button (click)="onDownloadAll(vm)" 
                            class="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                            Export Archive
                          </button>
                          @if (vm.outputSizeMB) {
                            <p class="text-center text-[9px] font-mono text-gray-500 uppercase tracking-widest">Snapshot Buffer: {{ vm.outputSizeMB.toFixed(2) }} MB</p>
                          }
                       </div>
                    } @else {
                       <div class="h-14 w-full bg-gray-800/20 rounded-2xl flex items-center justify-center border border-dashed border-gray-800 opacity-50">
                          <span class="text-[10px] font-mono text-gray-600 uppercase tracking-widest animate-pulse">Scanning Pixels...</span>
                       </div>
                    }

                    @if (vm.status === 'error') {
                       <div class="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4" [@fadeIn]>
                          <svg class="w-5 h-5 text-rose-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                          <div class="flex-1">
                            <p class="text-white font-black text-xs uppercase tracking-tight">Logic Reject</p>
                            <p class="text-rose-400 font-mono text-[9px] mt-1 pr-2 leading-relaxed opacity-80">{{ vm.errorMessage || 'Unknown extraction failure' }}</p>
                            @if (vm.retryable) {
                               <button (click)="onExecuteSnapshot(vm)" class="mt-4 text-[10px] font-black uppercase text-white bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-full border border-white/10 transition-all">Retry Extract</button>
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
export class ThumbnailGeneratorComponent implements OnDestroy {
  private store = inject(Store);
  private snapshotService = inject(ThumbnailGeneratorService);
  private subscription = new Subscription();
  private blobUrls: string[] = [];
  
  readonly vm$ = this.store.select(selectThumbnailGeneratorState);
  videoUrl: string | null = null;

  onFileSelected(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(ThumbnailGeneratorActions.loadFile({ file }));
  }

  onDurationLoaded(duration: number): void {
    this.store.dispatch(ThumbnailGeneratorActions.loadMetaSuccess({
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

  onSetMode(mode: 'single' | 'grid' | 'interval'): void { this.store.dispatch(ThumbnailGeneratorActions.setMode({ mode })); }
  onTimestamp(e: Event): void { this.store.dispatch(ThumbnailGeneratorActions.setTimestamp({ timestamp: parseFloat((e.target as HTMLInputElement).value) })); }
  onInterval(e: Event): void { this.store.dispatch(ThumbnailGeneratorActions.setInterval({ intervalSeconds: parseInt((e.target as HTMLInputElement).value, 10) })); }
  onGridCols(e: Event): void { this.store.dispatch(ThumbnailGeneratorActions.setGridCols({ cols: parseInt((e.target as HTMLInputElement).value, 10) })); }
  onGridRows(e: Event): void { this.store.dispatch(ThumbnailGeneratorActions.setGridRows({ rows: parseInt((e.target as HTMLInputElement).value, 10) })); }
  onFormat(e: Event): void { this.store.dispatch(ThumbnailGeneratorActions.setImageFormat({ imageFormat: (e.target as HTMLSelectElement).value as any })); }
  onQuality(e: Event): void { this.store.dispatch(ThumbnailGeneratorActions.setJpgQuality({ quality: parseInt((e.target as HTMLInputElement).value, 10) })); }

  getMaxDuration(vm: ThumbnailGeneratorState): number { return vm.videoMeta?.duration || 100; }

  getBlobUrl(blob: Blob): string {
    const url = URL.createObjectURL(blob);
    this.blobUrls.push(url);
    return url;
  }

  onExecuteSnapshot(state: ThumbnailGeneratorState): void {
    if (!state.inputFile) return;
    
    this.store.dispatch(ThumbnailGeneratorActions.startProcessing());
    this.clearBlobUrls();

    this.subscription.add(
      this.snapshotService.process({
        file: state.inputFile,
        mode: state.mode,
        timestamp: state.timestamp,
        intervalSeconds: state.intervalSeconds,
        gridCols: state.gridCols,
        gridRows: state.gridRows,
        imageFormat: state.imageFormat,
        jpgQuality: state.jpgQuality,
        videoDuration: state.videoMeta?.duration || 0
      }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') {
            this.store.dispatch(ThumbnailGeneratorActions.updateProgress({ progress: msg.value ?? 0 }));
          } else if (msg.type === 'complete') {
            const dataArr = msg.data as ArrayBuffer[];
            const blobs = dataArr.map(ab => new Blob([ab], { type: `image/${state.imageFormat}` }));
            const totalSize = blobs.reduce((acc, curr) => acc + curr.size, 0);
            
            this.store.dispatch(ThumbnailGeneratorActions.processingSuccess({ 
              outputBlobs: blobs,
              outputSizeMB: totalSize / (1024 * 1024)
            }));
          }
        },
        error: (err) => {
          this.store.dispatch(ThumbnailGeneratorActions.processingFailure({ 
            errorCode: 'FFMPEG_COMMAND_FAILED', 
            message: err.message ?? 'Snapshot extraction failed.',
            retryable: true
          }));
        }
      })
    );
  }

  onDownloadSingle(blob: Blob, index: number): void {
    const url = URL.createObjectURL(blob);
    const filename = `snapshot_${index + 1}.jpg`; // Format dynamically if needed
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 150);
  }

  onDownloadAll(state: ThumbnailGeneratorState): void {
    state.outputBlobs.forEach((blob, i) => this.onDownloadSingle(blob, i));
  }

  onReset(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = null;
    this.clearBlobUrls();
    this.store.dispatch(ThumbnailGeneratorActions.resetState());
  }

  private clearBlobUrls(): void {
    this.blobUrls.forEach(url => URL.revokeObjectURL(url));
    this.blobUrls = [];
  }

  ngOnDestroy(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.clearBlobUrls();
    this.subscription.unsubscribe();
  }
}