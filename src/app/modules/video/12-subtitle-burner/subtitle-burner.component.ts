import { fadeIn, slideUp, slideInRight, popIn, staggerFade, buttonState } from '../../../shared/animations';
import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
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
  imports: [AsyncPipe, DecimalPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-teal-400 via-cyan-500 to-sky-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Nova Engine
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Forge Engine: Stream Hardcoding v1.0</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.videoFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-teal-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-teal-950/30 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </span>
              Purge Payload
            </button>
          }
        }
      </div>

      @if (vm$ | async; as vm) {
        
        @if (!vm.videoFile) {
          <div class="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full py-20" [@slideUp]>
            <app-file-drop-zone 
              accept="video/*" 
              (fileDropped)="onVideoSelected($event)"
              class="w-full">
            </app-file-drop-zone>
            
            <div class="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
               <div class="p-8 rounded-[2.5rem] bg-gray-900/40 border border-gray-800 backdrop-blur-md flex items-start gap-6 group hover:border-teal-500/30 transition-all duration-500">
                  <div class="w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-400 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-xl shadow-teal-500/5">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-black text-sm uppercase tracking-tight italic">Hardcode Injection</h4>
                    <p class="text-[10px] text-gray-500 mt-2 leading-relaxed font-medium uppercase tracking-widest opacity-60 italic">Permanently etch text streams into video frames. Zero-latency decoding for frame-accurate timing results.</p>
                  </div>
               </div>
               <div class="p-8 rounded-[2.5rem] bg-gray-900/40 border border-gray-800 backdrop-blur-md flex items-start gap-6 group hover:border-cyan-500/30 transition-all duration-500">
                  <div class="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform shadow-xl shadow-cyan-500/5">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-black text-sm uppercase tracking-tight italic">ASS Styling Logic</h4>
                    <p class="text-[10px] text-gray-400 mt-2 leading-relaxed font-medium uppercase tracking-widest opacity-60 italic">Convert SRT data to advanced ASS style descriptors. Supports outlines and alignment vectors automagically.</p>
                  </div>
               </div>
            </div>
          </div>
        }

        @if (vm.videoFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8 min-h-0" [@fadeIn]>
            
            <div class="flex-1 flex flex-col gap-8 min-h-0">
              <div class="relative group rounded-[2.5rem] overflow-hidden border border-gray-800 shadow-2xl bg-black/40 backdrop-blur-md flex items-center justify-center">
                <app-video-preview [videoUrl]="videoUrl" (durationLoaded)="onDurationLoaded($event)"></app-video-preview>
                
                @if (vm.status === 'processing') {
                   <div class="absolute inset-0 bg-gray-950/70 backdrop-blur-md flex flex-col items-center justify-center z-10" [@fadeIn]>
                      <app-progress-ring [progress]="vm.progress" [status]="'FORGING'"></app-progress-ring>
                      <div class="mt-8 flex flex-col items-center gap-2">
                         <span class="text-teal-400 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse italic font-black">Forge_Core_Warping</span>
                         <span class="text-gray-500 font-mono text-[8px] uppercase tracking-widest opacity-60 italic">Etching Text Matrix Patterns...</span>
                      </div>
                   </div>
                }
                
                <!-- Subtitle Indicator (Decorative) -->
                <div class="absolute top-8 right-8 px-4 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-xl backdrop-blur-md flex items-center gap-3">
                   <div class="w-2 h-2 rounded-full bg-teal-400 animate-pulse shadow-[0_0_10px_rgba(45,212,191,0.5)]"></div>
                   <span class="text-[9px] font-black text-teal-400 uppercase tracking-widest italic">Forge-Input_Active</span>
                </div>
              </div>

              <!-- Stream Metrics -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                 <div class="bg-gray-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-gray-800 flex flex-col gap-3 shadow-xl group hover:border-teal-500/20 transition-colors">
                    <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest italic opacity-60 leading-none">Source_Stream</span>
                    <span class="text-white font-mono text-xs font-black italic tracking-tighter truncate">{{ vm.videoFile.name }}</span>
                 </div>
                 <div class="bg-gray-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-gray-800 flex flex-col gap-3 shadow-xl group hover:border-teal-500/20 transition-colors">
                    <span class="text-[10px] font-black text-teal-500 uppercase tracking-widest italic opacity-60 leading-none">SRT_Matrix</span>
                    <span class="text-teal-400 font-mono text-[10px] font-black italic tracking-tighter uppercase truncate">
                       {{ vm.srtFile ? vm.srtFile.name : 'NULL_BUFFER' }}
                    </span>
                 </div>
                 <div class="bg-gray-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-gray-800 flex flex-col gap-3 shadow-xl group hover:border-teal-500/20 transition-colors">
                    <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest italic opacity-60 leading-none">Overlay_Spec</span>
                    <span class="text-white font-mono text-xs font-black italic tracking-tighter uppercase">{{ vm.fontFamily }} / {{ vm.fontSize }}px</span>
                 </div>
                 <div class="bg-gray-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-gray-800 flex flex-col gap-3 shadow-xl group hover:border-teal-500/20 transition-colors">
                    <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest italic opacity-60 leading-none">VFS_Status</span>
                    <span class="text-white font-mono text-[10px] font-black italic tracking-tighter uppercase truncate">libass_render_v0.1</span>
                 </div>
              </div>
            </div>

            <div class="w-full lg:w-[420px] shrink-0 flex flex-col gap-8">
              
              <!-- Settings Panel -->
              <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-[2.5rem] p-10 flex flex-col gap-8 shadow-2xl relative overflow-hidden">
                 <div class="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-teal-500/20 to-transparent"></div>
                 
                 <!-- Subtitle Input -->
                 <div class="p-8 bg-black/40 rounded-[2rem] border border-gray-800 shadow-xl group hover:border-teal-500/20 transition-colors duration-500">
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] italic opacity-60 mb-6">Subtitle_VFS_Buffer</label>
                    <div (click)="srtInput.click()" (keydown.enter)="srtInput.click()" tabindex="0" role="button" aria-label="Upload Subtitle Vector"
                      [class]="vm.srtFile ? 'border-teal-500/40 bg-teal-500/5' : 'border-white/5 bg-white/5'"
                      class="p-8 rounded-2xl border border-dashed transition-all cursor-pointer group/btn text-center relative overflow-hidden active:scale-95 shadow-inner">
                       @if (vm.srtFile) {
                          <div class="flex flex-col items-center gap-3">
                             <span class="text-teal-400 text-xs font-black uppercase italic tracking-tighter">{{ vm.srtFile.name }}</span>
                             <span class="text-[9px] text-gray-600 uppercase tracking-[0.2em] font-black italic opacity-60">{{ (vm.srtFile.size / 1024) | number:'1.1-1' }} KB / Segmented</span>
                          </div>
                       } @else {
                          <div class="flex flex-col items-center gap-4">
                             <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-600 group-hover/btn:text-teal-400 group-hover/btn:scale-110 transition-all">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                             </div>
                             <span class="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Inject_SRT_Vector</span>
                          </div>
                       }
                       <input #srtInput type="file" accept=".srt" class="hidden" (change)="onSrtSelected($event)">
                    </div>
                 </div>

                 <!-- Typography & Positioning -->
                 <div class="grid grid-cols-2 gap-4">
                    <div class="p-5 bg-black/40 rounded-[1.8rem] border border-gray-800 shadow-xl group hover:border-teal-500/20 transition-colors duration-500">
                       <label class="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-3 block italic">Font_Core</label>
                       <select (change)="onFontChange($event)" class="w-full bg-transparent border-none text-[10px] font-black text-white focus:outline-none appearance-none uppercase tracking-tighter italic">
                          @for (f of fonts; track f) {
                             <option [value]="f" [selected]="vm.fontFamily === f" class="bg-gray-900">{{ f }}</option>
                          }
                       </select>
                    </div>
                    <div class="p-1.5 bg-black/40 rounded-[1.8rem] border border-gray-800 flex shadow-inner group transition-colors duration-500">
                       <button (click)="onSetPosition('bottom')" [class]="vm.position === 'bottom' ? 'bg-teal-500 text-teal-950 font-black shadow-lg rounded-2xl' : 'text-gray-500 hover:text-white opacity-40'"
                         class="flex-1 text-[9px] uppercase font-black transition-all italic scale-90">Down</button>
                       <button (click)="onSetPosition('top')" [class]="vm.position === 'top' ? 'bg-teal-500 text-teal-950 font-black shadow-lg rounded-2xl' : 'text-gray-500 hover:text-white opacity-40'"
                         class="flex-1 text-[9px] uppercase font-black transition-all italic scale-90">Up</button>
                    </div>
                 </div>

                 <!-- Font Adjustments -->
                 <div class="p-8 bg-black/40 rounded-[2rem] border border-gray-800 shadow-xl group hover:border-teal-500/20 transition-colors duration-500">
                    <div class="flex justify-between items-center mb-6">
                       <label class="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] italic opacity-60">FontSize_Offset</label>
                       <span class="text-[10px] font-black font-mono text-teal-400 italic">{{ vm.fontSize }}px</span>
                    </div>
                    <input type="range" min="12" max="120" step="1" [value]="vm.fontSize" (input)="onFontSize($event)"
                      class="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-teal-500 focus:outline-none shadow-inner">
                 </div>

                 <!-- Spectral Color Theme -->
                 <div class="p-8 bg-black/40 rounded-[2rem] border border-gray-800 shadow-xl group hover:border-teal-500/20 transition-colors duration-500">
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6 italic opacity-60">Spectral_Theme</label>
                    <div class="flex gap-4 flex-wrap justify-between">
                       @for (c of colors; track c.value) {
                          <button (click)="onSetColor(c.value)"
                            [class]="vm.fontColor === c.value ? 'ring-2 ring-teal-500 ring-offset-4 ring-offset-gray-950 scale-110 shadow-[0_0_20px_rgba(45,212,191,0.3)]' : 'hover:scale-105 opacity-40'"
                            [style.background]="c.value"
                            class="w-8 h-8 rounded-full border-2 border-white/5 transition-all active:scale-90"
                            [title]="c.label">
                          </button>
                       }
                    </div>
                 </div>

                 <!-- Action Button Area -->
                 <div class="pt-6 border-t border-gray-800/50">
                    @if (vm.status === 'idle' || vm.status === 'error') {
                       <button (click)="onApplyForge(vm)"
                         [disabled]="!vm.srtFile"
                         class="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:opacity-90 disabled:opacity-20 text-white font-black py-5 rounded-2xl shadow-2xl shadow-teal-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.25em] flex items-center justify-center gap-4 italic">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                         Execute Forge
                       </button>
                    } @else if (vm.status === 'success') {
                       <div class="space-y-4" [@slideUp]>
                          <button (click)="onDownload(vm)" 
                            class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 group italic">
                            <svg class="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Export Hardcoded Stream
                          </button>
                          @if (vm.outputSizeMB) {
                            <p class="text-center text-[9px] font-black font-mono text-emerald-500/60 uppercase tracking-[0.3em] italic">Density_Verified: {{ vm.outputSizeMB | number:'1.2-2' }} MB</p>
                          }
                       </div>
                    } @else {
                       <div class="h-16 w-full bg-gray-950/40 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-800/50 opacity-40">
                          <span class="text-[10px] font-black font-mono text-gray-500 uppercase tracking-[0.4em] animate-pulse italic">Etching_Text_Stream...</span>
                       </div>
                    }

                    @if (vm.status === 'error') {
                       <div class="mt-6 p-6 bg-rose-500/5 border border-rose-500/20 rounded-[1.5rem] flex items-start gap-4 animate-in shake-1 duration-500" [@fadeIn]>
                          <div class="w-10 h-10 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 shrink-0 shadow-lg">
                             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                          </div>
                          <div class="flex-1 min-w-0">
                            <p class="text-white font-black text-xs uppercase tracking-tight italic">Forge_Integration_Fault</p>
                            <p class="text-rose-400 font-black font-mono text-[9px] mt-1.5 leading-relaxed uppercase tracking-wider opacity-80 italic line-clamp-2">{{ vm.errorMessage || 'Unknown text overlay corruption error' }}</p>
                            @if (vm.retryable) {
                               <button (click)="onApplyForge(vm)" class="mt-4 text-[9px] font-black uppercase text-white border-b-2 border-white/10 hover:border-teal-500 transition-all hover:text-teal-400 tracking-[0.2em] italic">Retry_Attempt_Ops</button>
                            }
                          </div>
                       </div>
                    }
                 </div>
              </div>

              <!-- Technical Command visualizer -->
              <div class="bg-gray-900/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-gray-800 shadow-inner">
                 <h4 class="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] mb-4 italic opacity-60">Forge_Kernel_Visualizer</h4>
                 <div class="bg-black/60 p-5 rounded-2xl border border-white/5 font-mono group overflow-hidden relative">
                    <div class="text-[9px] text-teal-400/80 leading-relaxed uppercase tracking-widest italic group-hover:scale-105 transition-transform duration-500">
                       <span class="opacity-40">ffmpeg -i src.mp4 -vf</span> 
                       <span class="font-black text-white px-1.5 py-0.5 bg-teal-500/20 rounded-md mx-1 shadow-sm border border-teal-500/20 truncate">subtitles=src.srt:force_style='FontName={{ vm.fontFamily }},FontSize={{ vm.fontSize }},PrimaryColour=&H{{ vm.fontColor.substring(1) }}'</span>
                       <span class="opacity-40">dst.mp4</span>
                    </div>
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
            message: err.message ?? 'Forge integration failed. Pixel buffer overlay rejected.',
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
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
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