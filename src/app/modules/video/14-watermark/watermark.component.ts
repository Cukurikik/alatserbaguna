import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { WatermarkActions, selectWatermarkState, WatermarkState, WatermarkPosition } from './watermark.store';
import { WatermarkService } from './watermark.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

const POSITIONS: { label: string; value: WatermarkPosition }[] = [
  { label: 'TL', value: 'TL' }, { label: 'TC', value: 'TC' }, { label: 'TR', value: 'TR' },
  { label: 'ML', value: 'ML' }, { label: 'MC', value: 'MC' }, { label: 'MR', value: 'MR' },
  { label: 'BL', value: 'BL' }, { label: 'BC', value: 'BC' }, { label: 'BR', value: 'BR' },
];

@Component({
  selector: 'app-watermark',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-violet-400 via-fuchsia-500 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Brand Engine
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Overlay Matrix: Alpha Blending v1.0</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.inputFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-violet-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-violet-950/30 transition-colors">
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
               <div class="p-6 rounded-2xl bg-violet-500/5 border border-violet-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-3a2 2 0 01-2-2V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Identity Overlay</h4>
                    <p class="text-xs text-gray-500 mt-1">Embed permanent digital identifiers into container bitstreams. Supports text and image assets.</p>
                  </div>
               </div>
               <div class="p-6 rounded-2xl bg-fuchsia-500/5 border border-fuchsia-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-fuchsia-500/10 rounded-xl flex items-center justify-center text-fuchsia-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Dynamic Alpha</h4>
                    <p class="text-xs text-gray-500 mt-1">Granular opacity control for subtle branding. High-fidelity rendering with zero frame drop.</p>
                  </div>
               </div>
            </div>
          </div>
        }

        <!-- Pillar 4: Component Logic Area -->
        @if (vm.inputFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8" [@fadeIn]>
            
            <!-- Left: Preview & Status -->
            <div class="flex-1 flex flex-col gap-6">
              <div class="relative group rounded-3xl overflow-hidden border border-gray-800 shadow-2xl bg-black/40 aspect-video flex items-center justify-center">
                <app-video-preview [videoUrl]="videoUrl" (durationLoaded)="onDurationLoaded($event)"></app-video-preview>
                
                @if (vm.status === 'processing') {
                   <div class="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-10" [@fadeIn]>
                      <app-progress-ring [progress]="vm.progress" [status]="'BRANDING'"></app-progress-ring>
                      <div class="mt-6 flex flex-col items-center gap-2 text-center px-6">
                         <p class="text-violet-400 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse font-black">Blending Identity Map</p>
                         <p class="text-gray-500 font-mono text-[8px] uppercase">Alpha Channel Inversion Engine Active</p>
                      </div>
                   </div>
                }

                <!-- Live Interface Simulation -->
                <div [class]="getPreviewPosClass(vm.position)" 
                  [style.opacity]="vm.opacity"
                  [style.color]="vm.textColor"
                  [style.fontSize.px]="vm.textSize / 2"
                  class="absolute font-black pointer-events-none select-none drop-shadow-2xl transition-all duration-300 uppercase italic tracking-tighter z-10">
                   @if (vm.mode === 'text') {
                      {{ vm.text }}
                   } @else {
                      <div class="w-16 h-16 bg-white/20 border border-white/40 rounded-lg flex items-center justify-center backdrop-blur-sm">
                         <span class="text-[8px]">LOGO</span>
                      </div>
                   }
                </div>

                <div class="absolute top-4 right-4 px-3 py-1 bg-violet-500/20 border border-violet-500/40 rounded-lg backdrop-blur-md flex items-center gap-2">
                   <div class="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></div>
                   <span class="text-[9px] font-black text-violet-400 uppercase tracking-widest">Brand-Input v1.2</span>
                </div>
              </div>

              <!-- Stream Dashboard -->
              <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                 <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Base Stream</span>
                       <span class="text-white font-mono text-xs truncate">{{ vm.inputFile.name }}</span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono">
                       <span class="text-[9px] font-black text-violet-500/60 uppercase tracking-widest leading-none mb-1">Alpha Mode</span>
                       <span class="text-violet-400 text-xs font-black truncate uppercase">
                          {{ vm.mode }} / {{ (vm.opacity * 100).toFixed(0) }}%
                       </span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Vector POS</span>
                       <span class="text-white text-[10px] uppercase font-black tracking-tighter">
                          Coordinate: {{ vm.position }}
                       </span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pl-4">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Codec Pipeline</span>
                       <span class="text-gray-400 font-mono text-[10px] tracking-tighter">drawtext_render_v0.5</span>
                    </div>
                 </div>
                 <div class="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-transparent"></div>
              </div>
            </div>

            <!-- Right: Parameters Panel -->
            <div class="w-full lg:w-[420px] flex flex-col gap-6">
              
              <!-- Parameters Card -->
              <div class="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
                 
                 <!-- Mode Toggle -->
                 <div class="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-2xl border border-gray-800">
                    <button (click)="onSetMode('text')" [class]="vm.mode === 'text' ? 'bg-violet-500 text-violet-950 font-black' : 'text-gray-500 hover:text-white'"
                      class="py-3 rounded-xl text-[9px] uppercase font-black transition-all">Text Matrix</button>
                    <button (click)="onSetMode('image')" [class]="vm.mode === 'image' ? 'bg-violet-500 text-violet-950 font-black' : 'text-gray-500 hover:text-white'"
                      class="py-3 rounded-xl text-[9px] uppercase font-black transition-all">Image Buffer</button>
                 </div>

                 <!-- Contextual Controls -->
                 @if (vm.mode === 'text') {
                    <div class="space-y-4" [@fadeIn]>
                       <div>
                          <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 leading-none italic opacity-60">Identity String</label>
                          <input type="text" [value]="vm.text" (input)="onSetText($event)"
                            class="w-full bg-black/40 border border-gray-800 rounded-2xl px-5 py-4 text-xs font-black text-white focus:outline-none focus:border-violet-500/50 uppercase tracking-widest placeholder:text-gray-800">
                       </div>
                       <div class="grid grid-cols-2 gap-4">
                          <div class="p-4 bg-black/40 rounded-2xl border border-gray-800">
                             <label class="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3 block">Size Point</label>
                             <input type="number" [value]="vm.textSize" (input)="onSetTextSize($event)" class="w-full bg-transparent text-white font-mono font-black text-xs border-b border-gray-800 focus:outline-none focus:border-violet-500 transition-colors uppercase">
                          </div>
                          <div class="p-4 bg-black/40 rounded-2xl border border-gray-800">
                             <label class="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3 block">Color HEX</label>
                             <input type="color" [value]="vm.textColor" (input)="onSetTextColor($event)" class="w-full h-8 bg-transparent rounded cursor-pointer border-none p-0 outline-none transition-all">
                          </div>
                       </div>
                    </div>
                 } @else {
                    <div class="space-y-4" [@fadeIn]>
                       <div>
                          <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 leading-none italic opacity-60">Logo Asset (.png/.jpg)</label>
                          <div (click)="imageInput.click()" (keydown.enter)="imageInput.click()" tabindex="0" role="button" aria-label="Upload Image Asset"
                            [class]="vm.imageFile ? 'border-violet-500/40 bg-violet-500/5' : 'border-gray-800 bg-black/40'"
                            class="p-8 rounded-2xl border border-dashed hover:border-violet-500/20 transition-all cursor-pointer group text-center relative overflow-hidden">
                             @if (vm.imageFile) {
                                <div class="flex flex-col items-center gap-2">
                                   <span class="text-violet-400 text-[10px] font-black uppercase">{{ vm.imageFile.name }}</span>
                                   <span class="text-[9px] text-gray-600 uppercase tracking-widest">Asset Loaded</span>
                                </div>
                             } @else {
                                <div class="flex flex-col items-center gap-3">
                                   <svg class="w-10 h-10 text-gray-800 group-hover:text-violet-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 112.828 2.828l-7.414 7.414a2 2 0 01-2.828 0L4 16z"/></svg>
                                   <span class="text-[10px] font-black text-gray-700 uppercase tracking-widest">Inject Image Buffer</span>
                                </div>
                             }
                             <input #imageInput type="file" accept="image/*" class="hidden" (change)="onImageSelected($event)">
                          </div>
                       </div>
                    </div>
                 }

                 <!-- Position Matrix -->
                 <div>
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 leading-none italic opacity-60">Spatial Sector</label>
                    <div class="grid grid-cols-3 gap-2 bg-black/40 p-3 rounded-2xl border border-gray-800 aspect-square max-w-[200px] mx-auto">
                       @for (pos of positions; track pos.value) {
                          <button (click)="onSetPosition(pos.value)" [class]="vm.position === pos.value ? 'bg-violet-500 shadow-lg shadow-violet-500/20 border-violet-400' : 'bg-gray-900 border-gray-800 hover:border-violet-500/30'"
                            class="rounded-lg border transition-all flex items-center justify-center group active:scale-90">
                             <div [class]="vm.position === pos.value ? 'bg-violet-950 shadow-inner' : 'bg-gray-800'" class="w-1.5 h-1.5 rounded-full transition-colors"></div>
                          </button>
                       }
                    </div>
                 </div>

                 <!-- Opacity -->
                 <div class="p-6 bg-black/40 rounded-2xl border border-gray-800">
                    <div class="flex justify-between items-center mb-4">
                       <label class="text-[10px] font-black text-gray-400 uppercase tracking-wide italic opacity-60">Alpha Blend Magnitude</label>
                       <span class="text-[10px] font-mono font-black text-violet-400">{{ (vm.opacity * 100).toFixed(0) }}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.01" [value]="vm.opacity" (input)="onSetOpacity($event)"
                      class="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-violet-500">
                 </div>

                 <!-- Action Area -->
                 <div class="pt-4 border-t border-gray-800/50">
                    @if (vm.status === 'idle' || vm.status === 'error') {
                       <button (click)="onApplyBrand(vm)"
                         class="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white font-black py-4 rounded-2xl shadow-xl shadow-violet-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                         Execute Brand
                       </button>
                    } @else if (vm.status === 'success') {
                       <div class="space-y-3" [@slideUp]>
                          <button (click)="onDownload(vm)" 
                            class="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Export Identity
                          </button>
                          @if (vm.outputSizeMB) {
                            <p class="text-center text-[9px] font-mono text-gray-500 uppercase tracking-widest">Branded Volume: {{ vm.outputSizeMB.toFixed(2) }} MB</p>
                          }
                       </div>
                    } @else {
                       <div class="h-14 w-full bg-gray-800/20 rounded-2xl flex items-center justify-center border border-dashed border-gray-800 opacity-50">
                          <span class="text-[10px] font-mono text-gray-600 uppercase tracking-widest animate-pulse">Alpha Mapping in Progress...</span>
                       </div>
                    }

                    @if (vm.status === 'error') {
                       <div class="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4" [@fadeIn]>
                          <svg class="w-5 h-5 text-rose-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                          <div class="flex-1">
                            <p class="text-white font-black text-xs uppercase tracking-tight">Identity Rejection</p>
                            <p class="text-rose-400 font-mono text-[9px] mt-1 pr-2 leading-relaxed opacity-80">{{ vm.errorMessage || 'Unknown blend failure' }}</p>
                            @if (vm.retryable) {
                               <button (click)="onApplyBrand(vm)" class="mt-4 text-[10px] font-black uppercase text-white bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-full border border-white/10 transition-all">Restart Blend</button>
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
export class WatermarkComponent implements OnDestroy {
  private store = inject(Store);
  private brandService = inject(WatermarkService);
  private subscription = new Subscription();
  
  readonly vm$ = this.store.select(selectWatermarkState);
  videoUrl: string | null = null;
  readonly positions = POSITIONS;

  onFileSelected(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(WatermarkActions.loadFile({ file }));
  }

  onDurationLoaded(duration: number): void {
    this.store.dispatch(WatermarkActions.loadMetaSuccess({
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

  onSetMode(mode: 'text' | 'image'): void { this.store.dispatch(WatermarkActions.setMode({ mode })); }
  onSetText(e: Event): void { this.store.dispatch(WatermarkActions.setText({ text: (e.target as HTMLInputElement).value })); }
  onSetTextSize(e: Event): void { this.store.dispatch(WatermarkActions.setTextSize({ size: parseInt((e.target as HTMLInputElement).value, 10) })); }
  onSetTextColor(e: Event): void { this.store.dispatch(WatermarkActions.setTextColor({ color: (e.target as HTMLInputElement).value })); }
  onSetOpacity(e: Event): void { this.store.dispatch(WatermarkActions.setOpacity({ opacity: parseFloat((e.target as HTMLInputElement).value) })); }
  onSetPosition(position: WatermarkPosition): void { this.store.dispatch(WatermarkActions.setPosition({ position })); }
  
  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.store.dispatch(WatermarkActions.loadImageFile({ file }));
  }

  getPreviewPosClass(pos: WatermarkPosition): string {
    const map: Record<WatermarkPosition, string> = {
      'TL': 'top-8 left-8', 'TC': 'top-8 left-1/2 -translate-x-1/2', 'TR': 'top-8 right-8',
      'ML': 'top-1/2 -translate-y-1/2 left-8', 'MC': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2', 'MR': 'top-1/2 -translate-y-1/2 right-8',
      'BL': 'bottom-8 left-8', 'BC': 'bottom-8 left-1/2 -translate-x-1/2', 'BR': 'bottom-8 right-8'
    };
    return map[pos];
  }

  onApplyBrand(state: WatermarkState): void {
    if (!state.inputFile || (state.mode === 'image' && !state.imageFile)) return;
    
    this.store.dispatch(WatermarkActions.startProcessing());
    
    this.subscription.add(
      this.brandService.process({
        videoFile: state.inputFile,
        mode: state.mode,
        watermarkFile: state.imageFile || undefined,
        text: state.text,
        fontFamily: 'Arial',
        fontSize: state.textSize,
        fontColor: state.textColor,
        position: state.position,
        opacity: state.opacity,
        videoMeta: state.videoMeta!
      }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') {
            this.store.dispatch(WatermarkActions.updateProgress({ progress: msg.value ?? 0 }));
          } else if (msg.type === 'complete') {
            const blob = new Blob([msg.data as BlobPart], { type: 'video/mp4' });
            this.store.dispatch(WatermarkActions.processingSuccess({ 
              outputBlob: blob,
              outputSizeMB: blob.size / (1024 * 1024)
            }));
          }
        },
        error: (err) => {
          this.store.dispatch(WatermarkActions.processingFailure({ 
            errorCode: 'FFMPEG_COMMAND_FAILED', 
            message: err.message ?? 'Brand blending failed.',
            retryable: true
          }));
        }
      })
    );
  }

  onDownload(state: WatermarkState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const filename = this.brandService.getOutputFilename(state.inputFile?.name || 'video');
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  onReset(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = null;
    this.store.dispatch(WatermarkActions.resetState());
  }

  ngOnDestroy(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.subscription.unsubscribe();
  }
}