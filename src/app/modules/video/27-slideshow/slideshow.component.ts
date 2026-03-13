import { fadeIn, slideUp, slideInRight, popIn, staggerFade, buttonState } from '../../../shared/animations';
import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { SlideshowActions, selectSlideshowState, SlideshowState } from './slideshow.store';
import { SlideshowService } from './slideshow.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-slideshow',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-amber-400 via-orange-500 to-rose-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Aura Engine
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Temporal Transmutation: Ken Burns v1.0</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.images.length > 0) {
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
        
        <div class="flex-1 flex flex-col gap-8" [@fadeIn]>
            
            <!-- Asset Gallery -->
            <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-8 shadow-xl relative overflow-hidden flex flex-col gap-6">
               <div class="flex justify-between items-center px-2">
                  <span class="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] italic opacity-60">Visual_Asset_Nodes</span>
                  <div class="flex gap-4">
                     <button (click)="onAddBatch()" class="text-[9px] font-black text-amber-400 hover:text-amber-300 uppercase underline transition-colors">Import_Frames</button>
                  </div>
               </div>

               <div class="flex gap-4 items-center overflow-x-auto pb-4 custom-scrollbar px-2">
                  @for (img of vm.images; track img; let i = $index) {
                     <div class="shrink-0 group relative">
                        <div class="w-32 aspect-square rounded-2xl bg-black/60 border border-gray-800 overflow-hidden relative shadow-lg group-hover:border-amber-500/50 transition-all">
                           <div class="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent"></div>
                           <div class="absolute inset-0 flex flex-col items-center justify-center gap-2">
                              <svg class="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                              <span class="text-[7px] font-mono text-gray-600 truncate w-24 text-center px-2 uppercase">{{ img.name }}</span>
                           </div>
                           <button (click)="onRemoveImage(i)" class="absolute top-2 right-2 p-1 bg-black/60 rounded-lg text-gray-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                           </button>
                           <div class="absolute bottom-2 left-2 px-1.5 py-0.5 bg-amber-500/20 rounded-md">
                              <span class="text-[7px] font-black text-amber-400 uppercase tracking-widest">#{{ i + 1 }}</span>
                           </div>
                        </div>
                     </div>
                  }

                  @if (vm.images.length === 0) {
                     <div class="flex-1 py-12 flex flex-col items-center gap-4">
                        <app-file-drop-zone accept="image/*" (fileDropped)="onAddImage($event)" class="w-full max-w-sm"></app-file-drop-zone>
                     </div>
                  } @else {
                     <button (click)="onAddBatch()" class="shrink-0 w-32 aspect-square rounded-2xl bg-gray-950 border-2 border-dashed border-gray-800 flex flex-col items-center justify-center gap-3 text-gray-700 hover:text-amber-500 hover:border-amber-500/40 transition-all">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                        <span class="text-[9px] font-black uppercase tracking-widest">Add Image</span>
                     </button>
                  }
               </div>
            </div>

            <div class="flex flex-col lg:flex-row gap-8">
               
               <!-- Parameter Configuration -->
               <div class="flex-1 bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden">
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <!-- Global Timing -->
                     <div class="flex flex-col gap-4">
                        <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Global Frame Hold</label>
                        <div class="p-6 bg-black/40 rounded-2xl border border-gray-800 flex flex-col gap-4">
                           <div class="flex justify-between items-center">
                              <span class="text-[10px] font-mono text-gray-500 uppercase italic">TX_Duration</span>
                              <span class="text-xs font-black text-amber-400 font-mono">{{ vm.defaultDuration }}s</span>
                           </div>
                           <input type="range" min="1" max="10" step="1" [value]="vm.defaultDuration" (input)="onSetDefaultDuration($event)"
                             class="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500">
                        </div>
                     </div>

                     <!-- Interpolation Engine -->
                     <div class="flex flex-col gap-4">
                        <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Interpolation Engine</label>
                        <button (click)="toggleKenBurns()" [class]="vm.kenBurns ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-black/40 border-gray-800 text-gray-500'"
                          class="p-6 rounded-2xl border transition-all flex items-center justify-between group">
                           <div class="flex flex-col gap-1 items-start">
                              <span class="text-[10px] font-black uppercase tracking-widest">Ken Burns Effect</span>
                              <span class="text-[8px] font-mono opacity-60 uppercase italic">Adaptive Zoom & Pan</span>
                           </div>
                           <div [class]="vm.kenBurns ? 'bg-amber-400 scale-110 shadow-lg shadow-amber-500/40' : 'bg-gray-800'" class="w-4 h-4 rounded-full transition-all"></div>
                        </button>
                     </div>
                  </div>

                  <!-- Audio Matrix -->
                  <div class="flex flex-col gap-4">
                     <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Acoustic Matrix Overlay</label>
                     <div class="p-6 rounded-2xl bg-black/40 border border-gray-800 flex flex-col md:flex-row items-center gap-6">
                        <div class="flex-1 w-full">
                           @if (vm.musicFile) {
                              <div class="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
                                 <div class="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
                                 </div>
                                 <div class="flex-1 truncate">
                                    <p class="text-[10px] font-black text-white uppercase tracking-tight truncate">{{ vm.musicFile.name }}</p>
                                    <p class="text-[8px] font-mono text-gray-500 uppercase tracking-widest mt-0.5">MP3/WAV Stream</p>
                                 </div>
                                 <button (click)="onSetMusicFile(null)" class="text-rose-500 hover:text-rose-400 p-2">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                 </button>
                              </div>
                           } @else {
                              <button (click)="triggerMusicInput()" class="w-full py-3 rounded-xl border border-dashed border-gray-800 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] hover:text-amber-500 hover:border-amber-500/40 transition-all italic">
                                 + Inject_Audio_Stream
                              </button>
                           }
                        </div>
                        <div class="w-full md:w-48 bg-gray-950/40 p-3 rounded-xl border border-gray-800 flex items-center gap-3">
                           <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
                           <input type="range" [value]="vm.musicVolume * 100" (input)="onSetMusicVolume($event)" class="flex-1 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500">
                        </div>
                     </div>
                  </div>

                  <!-- Transmutation Trigger -->
                  <div class="pt-4 border-t border-gray-800/50">
                     @if (vm.status === 'idle' || vm.status === 'error') {
                        <button (click)="onTransmute(vm)" [disabled]="vm.images.length === 0"
                          class="w-full bg-gradient-to-r from-amber-600 to-rose-600 hover:opacity-90 disabled:opacity-30 text-white font-black py-5 rounded-2xl shadow-xl shadow-amber-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                          Compile Aura Stream
                        </button>
                     } @else if (vm.status === 'success') {
                        <div class="space-y-3" [@slideUp]>
                           <button (click)="onDownload(vm)" 
                             class="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                             Export Transmuted Pkg
                           </button>
                           @if (vm.outputSizeMB) {
                             <p class="text-center text-[9px] font-mono text-gray-500 uppercase tracking-widest leading-none">Hydrated Volume: {{ vm.outputSizeMB.toFixed(2) }} MB</p>
                           }
                        </div>
                     } @else {
                        <div class="h-16 w-full bg-gray-800/20 rounded-2xl flex items-center justify-center border border-dashed border-gray-800 opacity-50 gap-4">
                           <div class="w-4 h-4 border-2 border-amber-500/40 border-t-amber-500 rounded-full animate-spin"></div>
                           <span class="text-[10px] font-mono text-gray-600 uppercase tracking-[0.3em] animate-pulse">Computing Temporal Aura...</span>
                        </div>
                     }
                  </div>
               </div>

               <!-- Status Monitor -->
               <div class="w-full lg:w-[320px] bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-8 shadow-2xl overflow-hidden relative flex flex-col items-center justify-center min-h-[300px]">
                  @if (vm.status === 'processing') {
                     <app-progress-ring [progress]="vm.progress" [status]="'TRANSMUTING'"></app-progress-ring>
                     <div class="mt-8 flex flex-col items-center text-center gap-2">
                        <p class="text-amber-400 font-mono text-[10px] uppercase tracking-[0.4em] font-black animate-pulse">Aura Kernel Synthesis</p>
                        <p class="text-gray-600 font-mono text-[8px] uppercase tracking-widest">Compiling Visual-Stream Matrix</p>
                     </div>
                  } @else {
                     <div class="flex flex-col items-center gap-6 opacity-30 text-center">
                        <div class="w-24 h-24 rounded-full border border-gray-800 flex items-center justify-center relative">
                           <svg class="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                           <div class="absolute inset-0 rounded-full border border-amber-500/10 scale-125 animate-ping duration-[3s]"></div>
                        </div>
                        <p class="text-[9px] font-black text-white/50 uppercase tracking-[0.4em] italic leading-relaxed">Aura_Engine_Ready<br>Awaiting_Asset_Nodes</p>
                     </div>
                  }
                  <div class="absolute inset-0 bg-gradient-to-t from-amber-500/5 to-transparent pointer-events-none"></div>
               </div>
            </div>
        </div>
      }
      <input type="file" #musicInput class="hidden" (change)="onMusicSelected($event)" accept="audio/*">
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
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
export class SlideshowComponent implements OnDestroy {
  private store = inject(Store);
  private auraService = inject(SlideshowService);
  private subscription = new Subscription();
  
  readonly vm$ = this.store.select(selectSlideshowState);

  onAddImage(file: File): void { this.store.dispatch(SlideshowActions.addImages({ files: [file] })); }
  onRemoveImage(index: number): void { this.store.dispatch(SlideshowActions.removeImage({ index })); }
  onSetDefaultDuration(e: Event): void { this.store.dispatch(SlideshowActions.setDefaultDuration({ duration: parseInt((e.target as HTMLInputElement).value, 10) })); }
  toggleKenBurns(): void { this.store.dispatch(SlideshowActions.toggleKenBurns()); }
  onSetMusicFile(file: File | null): void { this.store.dispatch(SlideshowActions.setMusicFile({ file })); }
  onSetMusicVolume(e: Event): void { this.store.dispatch(SlideshowActions.setMusicVolume({ volume: parseInt((e.target as HTMLInputElement).value, 10) / 100 })); }

  onAddBatch(): void {
    const input = document.createElement('input');
    input.type = 'file'; input.multiple = true; input.accept = 'image/*';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) this.store.dispatch(SlideshowActions.addImages({ files: Array.from(files) }));
    };
    input.click();
  }

  triggerMusicInput(): void {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'audio/*';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files[0]) this.onSetMusicFile(files[0]);
    };
    input.click();
  }

  onMusicSelected(e: Event): void {
    const files = (e.target as HTMLInputElement).files;
    if (files && files[0]) this.onSetMusicFile(files[0]);
  }

  onTransmute(state: SlideshowState): void {
    if (state.images.length === 0) return;
    
    this.store.dispatch(SlideshowActions.startProcessing());
    
    this.subscription.add(
      this.auraService.process({
        images: state.images,
        defaultDuration: state.defaultDuration,
        kenBurns: state.kenBurns,
        musicFile: state.musicFile || undefined,
        musicVolume: state.musicVolume,
        loopMusic: state.loopMusic
      }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') {
            this.store.dispatch(SlideshowActions.updateProgress({ progress: msg.value ?? 0 }));
          } else if (msg.type === 'complete') {
            const blob = new Blob([msg.data as BlobPart], { type: 'video/mp4' });
            this.store.dispatch(SlideshowActions.processingSuccess({ 
              outputBlob: blob,
              outputSizeMB: blob.size / (1024 * 1024)
            }));
          }
        },
        error: (err) => {
          this.store.dispatch(SlideshowActions.processingFailure({ 
            errorCode: 'FFMPEG_COMMAND_FAILED', 
            message: err.message ?? 'Aura stream synthesis calculation aborted.',
            retryable: true
          }));
        }
      })
    );
  }

  onDownload(state: SlideshowState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const filename = this.auraService.getOutputFilename();
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  onReset(): void {
    this.store.dispatch(SlideshowActions.resetState());
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}