import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { SubtitleBurnerActions, selectSubtitleBurnerState, SubtitleBurnerState } from './subtitle-burner.store';
import { SubtitleBurnerService } from './subtitle-burner.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

const FONTS = ['Arial', 'Impact', 'Courier New', 'Georgia', 'Verdana', 'Inter'];
const COLORS = [
  { label: 'Primary', value: '#FFFFFF' },
  { label: 'Solar', value: '#FFD700' },
  { label: 'Neon', value: '#00FFFF' },
  { label: 'Inferno', value: '#FF4500' },
  { label: 'Matrix', value: '#00FF00' },
];

@Component({
  selector: 'app-subtitle-burner',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-teal-400 via-cyan-500 to-sky-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Subtitle Burner
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Forge Engine: Stream Hardcoding</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.videoFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-teal-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-teal-950/30 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </span>
              Dispose
            </button>
          }
        }
      </div>

      @if (vm$ | async; as vm) {
        
        <!-- Pillar 5: I/O — Input State -->
        @if (!vm.videoFile) {
          <div class="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full" [@slideUp]>
            <app-file-drop-zone accept="video/*" (fileDropped)="onVideoSelected($event)"></app-file-drop-zone>
            
            <div class="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
               <div class="p-6 rounded-2xl bg-teal-500/5 border border-teal-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Hardcode Injection</h4>
                    <p class="text-xs text-gray-500 mt-1">Permanently etch text streams into video frames. Zero-latency decoding for frame-accurate timing.</p>
                  </div>
               </div>
               <div class="p-6 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">ASS Styling Logic</h4>
                    <p class="text-xs text-gray-500 mt-1">Convert SRT data to advanced ASS style descriptors. Supports outlines, shadows, and alignment vectors.</p>
                  </div>
               </div>
            </div>
          </div>
        }

        <!-- Pillar 4: Component Logic Area -->
        @if (vm.videoFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8" [@fadeIn]>
            
            <!-- Left: Preview & Forge Status -->
            <div class="flex-1 flex flex-col gap-6">
              <div class="relative group rounded-3xl overflow-hidden border border-gray-800 shadow-2xl bg-black/40 aspect-video flex items-center justify-center">
                <app-video-preview [videoUrl]="videoUrl" (durationLoaded)="onDurationLoaded($event)"></app-video-preview>
                
                @if (vm.status === 'processing') {
                   <div class="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-10" [@fadeIn]>
                      <app-progress-ring [progress]="vm.progress" [status]="'FORGING'"></app-progress-ring>
                      <div class="mt-6 flex flex-col items-center gap-2 text-center px-6">
                         <p class="text-teal-400 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse font-black">Etching Text Matrix</p>
                         <p class="text-gray-500 font-mono text-[8px] uppercase">Integrating libass Overlay Engine</p>
                      </div>
                   </div>
                }

                <!-- Subtitle Indicator (Decorative) -->
                <div class="absolute top-4 right-4 px-3 py-1 bg-teal-500/20 border border-teal-500/40 rounded-lg backdrop-blur-md flex items-center gap-2">
                   <div class="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></div>
                   <span class="text-[9px] font-black text-teal-400 uppercase tracking-widest">Forge-Input v1.0</span>
                </div>
              </div>

              <!-- Stream Dashboard -->
              <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                 <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Source Stream</span>
                       <span class="text-white font-mono text-xs truncate">{{ vm.videoFile?.name }}</span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono">
                       <span class="text-[9px] font-black text-teal-500/60 uppercase tracking-widest leading-none mb-1">SRT Matrix</span>
                       <span class="text-teal-400 text-xs font-black truncate">
                          {{ vm.srtFile ? vm.srtFile.name : 'Vektor Missing' }}
                       </span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Overlay Spec</span>
                       <span class="text-white text-[10px] uppercase font-black">
                          {{ vm.fontFamily }} / {{ vm.fontSize }}px
                       </span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pl-4">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Pipeline</span>
                       <span class="text-gray-400 font-mono text-[10px] tracking-tighter">libass_render_v0.1</span>
                    </div>
                 </div>
                 <div class="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-transparent to-transparent"></div>
              </div>
            </div>

            <!-- Right: Settings Panel -->
            <div class="w-full lg:w-[420px] flex flex-col gap-6">
              
              <!-- Parameters Card -->
              <div class="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
                 
                 <!-- Subtitle Input -->
                 <div>
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 leading-none italic opacity-60">Subtitle Vector (.srt)</label>
                    <div (click)="srtInput.click()" 
                      [class]="vm.srtFile ? 'border-teal-500/40 bg-teal-500/5' : 'border-gray-800 bg-black/40'"
                      class="p-6 rounded-2xl border border-dashed hover:border-teal-500/20 transition-all cursor-pointer group text-center relative overflow-hidden">
                       @if (vm.srtFile) {
                          <div class="flex flex-col items-center gap-2">
                             <span class="text-teal-400 text-xs font-black uppercase">{{ vm.srtFile.name }}</span>
                             <span class="text-[9px] text-gray-600 uppercase tracking-widest">{{ (vm.srtFile.size / 1024).toFixed(1) }} KB / Parsed</span>
                          </div>
                       } @else {
                          <div class="flex flex-col items-center gap-3">
                             <svg class="w-8 h-8 text-gray-600 group-hover:text-teal-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                             <span class="text-[10px] font-black text-gray-600 uppercase tracking-widest">Inject SRT Buffer</span>
                          </div>
                       }
                       <input #srtInput type="file" accept=".srt" class="hidden" (change)="onSrtSelected($event)">
                    </div>
                 </div>

                 <!-- Typography -->
                 <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-2">
                       <label class="text-[9px] font-black text-gray-600 uppercase tracking-widest">Font Family</label>
                       <select (change)="onFontChange($event)" class="bg-black/40 border border-gray-800 rounded-xl px-3 py-3 text-[10px] font-black text-white focus:outline-none focus:border-teal-500/50 appearance-none uppercase tracking-tighter">
                          @for (f of fonts; track f) {
                             <option [value]="f" [selected]="vm.fontFamily === f">{{ f }}</option>
                          }
                       </select>
                    </div>
                    <div class="flex flex-col gap-2">
                       <label class="text-[9px] font-black text-gray-600 uppercase tracking-widest">Vertical Position</label>
                       <div class="flex p-1 bg-black/40 rounded-xl border border-gray-800 h-full">
                          <button (click)="onSetPosition('bottom')" [class]="vm.position === 'bottom' ? 'bg-teal-500 text-teal-950 font-black' : 'text-gray-500 hover:text-white'"
                            class="flex-1 rounded-lg text-[9px] uppercase font-black transition-all">Down</button>
                          <button (click)="onSetPosition('top')" [class]="vm.position === 'top' ? 'bg-teal-500 text-teal-950 font-black' : 'text-gray-500 hover:text-white'"
                            class="flex-1 rounded-lg text-[9px] uppercase font-black transition-all">Up</button>
                       </div>
                    </div>
                 </div>

                 <!-- Font Adjustments -->
                 <div class="grid grid-cols-1 gap-4">
                    <div class="p-4 bg-black/40 rounded-2xl border border-gray-800">
                       <div class="flex justify-between items-center mb-3">
                          <label class="text-[10px] font-black text-gray-400 uppercase tracking-wide italic opacity-60">FontSize Vector</label>
                          <span class="text-[10px] font-mono font-black text-teal-400">{{ vm.fontSize }}px</span>
                       </div>
                       <input type="range" min="12" max="120" step="1" [value]="vm.fontSize" (input)="onFontSize($event)"
                         class="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-teal-500">
                    </div>

                    <div class="p-4 bg-black/40 rounded-2xl border border-gray-800">
                       <label class="block text-[10px] font-black text-gray-400 uppercase tracking-wide mb-3 italic opacity-60">Spectral Theme</label>
                       <div class="flex gap-2 flex-wrap">
                          @for (c of colors; track c.value) {
                             <button (click)="onSetColor(c.value)"
                               [class]="vm.fontColor === c.value ? 'ring-2 ring-teal-500 ring-offset-2 ring-offset-black scale-110' : 'hover:scale-105'"
                               [style.background]="c.value"
                               class="w-8 h-8 rounded-full border border-gray-800 transition-all active:scale-90"
                               [title]="c.label">
                             </button>
                          }
                       </div>
                    </div>
                 </div>

                 <!-- Action Area -->
                 <div class="pt-4 border-t border-gray-800/50">
                    @if (vm.status === 'idle' || vm.status === 'error') {
                       <button (click)="onApplyForge(vm)"
                         [disabled]="!vm.srtFile"
                         class="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:opacity-90 disabled:opacity-30 text-white font-black py-4 rounded-2xl shadow-xl shadow-teal-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                         Execute Forge
                       </button>
                    } @else if (vm.status === 'success') {
                       <div class="space-y-3" [@slideUp]>
                          <button (click)="onDownload(vm)" 
                            class="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Export Hardcoded
                          </button>
                          @if (vm.outputSizeMB) {
                            <p class="text-center text-[9px] font-mono text-gray-500 uppercase tracking-widest">Forged Volume: {{ vm.outputSizeMB.toFixed(2) }} MB</p>
                          }
                       </div>
                    } @else {
                       <div class="h-14 w-full bg-gray-800/20 rounded-2xl flex items-center justify-center border border-dashed border-gray-800 opacity-50">
                          <span class="text-[10px] font-mono text-gray-600 uppercase tracking-widest animate-pulse">Syncing Text Buffers...</span>
                       </div>
                    }

                    @if (vm.status === 'error') {
                       <div class="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4" [@fadeIn]>
                          <svg class="w-5 h-5 text-rose-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                          <div class="flex-1">
                            <p class="text-white font-black text-xs uppercase tracking-tight">Forge Failure</p>
                            <p class="text-rose-400 font-mono text-[9px] mt-1 pr-2 leading-relaxed opacity-80">{{ vm.errorMessage || 'libass overlay rejected' }}</p>
                            @if (vm.retryable) {
                               <button (click)="onApplyForge(vm)" class="mt-4 text-[10px] font-black uppercase text-white bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-full border border-white/10 transition-all">Restart Forge</button>
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
export class SubtitleBurnerComponent implements OnDestroy {
  private store = inject(Store);
  private burnerService = inject(SubtitleBurnerService);
  private subscription = new Subscription();
  
  readonly vm$ = this.store.select(selectSubtitleBurnerState);
  videoUrl: string | null = null;
  readonly fonts = FONTS;
  readonly colors = COLORS;

  onVideoSelected(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(SubtitleBurnerActions.loadVideo({ file }));
  }

  onSrtSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.store.dispatch(SubtitleBurnerActions.loadSrt({ file }));
    }
  }

  onDurationLoaded(duration: number): void {
    this.store.dispatch(SubtitleBurnerActions.loadMetaSuccess({
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

  onFontChange(e: Event): void { this.store.dispatch(SubtitleBurnerActions.setFontFamily({ fontFamily: (e.target as HTMLSelectElement).value })); }
  onFontSize(e: Event): void { this.store.dispatch(SubtitleBurnerActions.setFontSize({ fontSize: parseInt((e.target as HTMLInputElement).value, 10) })); }
  onSetColor(color: string): void { this.store.dispatch(SubtitleBurnerActions.setFontColor({ color })); }
  onSetPosition(position: 'bottom' | 'top'): void { this.store.dispatch(SubtitleBurnerActions.setPosition({ position })); }

  onApplyForge(state: SubtitleBurnerState): void {
    if (!state.videoFile || !state.srtFile) return;
    
    this.store.dispatch(SubtitleBurnerActions.startProcessing());
    
    this.subscription.add(
      this.burnerService.process({
        videoFile: state.videoFile,
        srtFile: state.srtFile,
        fontFamily: state.fontFamily,
        fontSize: state.fontSize,
        fontColor: state.fontColor,
        position: state.position
      }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') {
            this.store.dispatch(SubtitleBurnerActions.updateProgress({ progress: msg.value ?? 0 }));
          } else if (msg.type === 'complete') {
            const blob = new Blob([msg.data as BlobPart], { type: 'video/mp4' });
            this.store.dispatch(SubtitleBurnerActions.processingSuccess({ 
              outputBlob: blob,
              outputSizeMB: blob.size / (1024 * 1024)
            }));
          }
        },
        error: (err) => {
          this.store.dispatch(SubtitleBurnerActions.processingFailure({ 
            errorCode: 'FFMPEG_COMMAND_FAILED', 
            message: err.message ?? 'Forge integration failed. Check font memory.',
            retryable: true
          }));
        }
      })
    );
  }

  onDownload(state: SubtitleBurnerState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const filename = this.burnerService.getOutputFilename(state.videoFile?.name || 'video');
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
    this.store.dispatch(SubtitleBurnerActions.resetState());
  }

  ngOnDestroy(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.subscription.unsubscribe();
  }
}