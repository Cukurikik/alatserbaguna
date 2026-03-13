import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { TransitionsActions, selectTransitionsState, TransitionsState, TransitionDef } from './transitions.store';
import { TransitionsService } from './transitions.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-transitions',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-teal-400 via-emerald-500 to-green-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Flux Engine
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Temporal Blending: Xfade Kernel v1.0</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.clips.length > 0) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-emerald-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-emerald-950/30 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </span>
              Dispose
            </button>
          }
        }
      </div>

      @if (vm$ | async; as vm) {
        
        <div class="flex-1 flex flex-col gap-8" [@fadeIn]>
            
            <!-- Timeline Strip -->
            <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-8 shadow-xl relative overflow-hidden flex flex-col gap-6">
               <div class="flex justify-between items-center px-2">
                  <span class="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] italic">Temporal_Sequence_Linear</span>
                  <button (click)="onAddBatch()" class="text-[9px] font-black text-emerald-400 hover:text-emerald-300 uppercase underline transition-colors">Append_Nodes</button>
               </div>

               <div class="flex gap-4 items-center overflow-x-auto pb-4 custom-scrollbar px-2">
                  @for (clip of vm.clips; track clip; let i = $index) {
                     <!-- Clip Node -->
                     <div class="shrink-0 flex items-center gap-4">
                        <div class="relative group">
                           <div class="w-40 aspect-video rounded-2xl bg-black/60 border border-gray-800 overflow-hidden relative shadow-lg group-hover:border-emerald-500/50 transition-all">
                              <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>
                              <div class="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4">
                                 <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                                 <span class="text-[8px] font-mono text-gray-500 truncate w-full text-center uppercase tracking-tighter">{{ clip.name }}</span>
                              </div>
                              <button (click)="onRemoveClip(i)" class="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-gray-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                 <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                              </button>
                              <div class="absolute bottom-2 left-2 px-2 py-0.5 bg-emerald-500/20 rounded-md">
                                 <span class="text-[8px] font-black text-emerald-400 uppercase tracking-widest">IDX_{{ i + 1 }}</span>
                              </div>
                           </div>
                        </div>

                        <!-- Transition Junction -->
                        @if (i < vm.clips.length - 1) {
                           <div class="flex flex-col items-center gap-2 group/trans">
                              <div class="w-px h-8 bg-gray-800 group-hover/trans:bg-emerald-500/50 transition-all"></div>
                              <button (click)="onSetTrans(i, vm.transitions[i])" class="w-10 h-10 rounded-xl bg-gray-950 border border-gray-800 flex items-center justify-center text-gray-600 hover:text-emerald-400 hover:border-emerald-500/40 shadow-xl transition-all relative overflow-hidden">
                                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m0-4l4-4"/></svg>
                                 <div class="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover/trans:opacity-100 transition-opacity"></div>
                              </button>
                              <span class="text-[8px] font-mono text-gray-700 uppercase tracking-tighter">{{ vm.transitions[i].type }}</span>
                              <div class="w-px h-8 bg-gray-800 group-hover/trans:bg-emerald-500/50 transition-all"></div>
                           </div>
                        }
                     </div>
                  }

                  @if (vm.clips.length === 0) {
                     <div class="flex-1 py-12 flex flex-col items-center gap-4">
                        <app-file-drop-zone accept="video/*" (fileDropped)="onAddClip($event)" class="w-full max-w-sm"></app-file-drop-zone>
                        <p class="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] font-mono italic">Awaiting_Temporal_Clips...</p>
                     </div>
                  } @else {
                     <button (click)="onAddBatch()" class="shrink-0 w-40 aspect-video rounded-2xl bg-gray-950 border-2 border-dashed border-gray-800 flex flex-col items-center justify-center gap-3 text-gray-700 hover:text-emerald-500 hover:border-emerald-500/40 transition-all">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                        <span class="text-[10px] font-black uppercase tracking-widest">Add Clip</span>
                     </button>
                  }
               </div>
               
               <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent pointer-events-none"></div>
            </div>

            <!-- Lower: Control & Preview -->
            <div class="flex flex-col lg:flex-row gap-8">
               
               <!-- Action Card -->
               <div class="flex-1 bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col gap-6">
                  
                  <!-- Transition Logic Panel -->
                  <div>
                     <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 leading-none italic opacity-60">Global Sequence Protocol</label>
                     <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        @for (t of ['fade', 'wipeleft', 'wipedown', 'circlecrop']; track t) {
                           <button (click)="onApplyAll(t)" class="p-4 rounded-xl bg-black/40 border border-gray-800 text-gray-500 hover:text-white hover:border-emerald-500/40 transition-all text-[10px] uppercase font-black flex flex-col items-center gap-2">
                              <span class="w-8 h-8 rounded-lg bg-emerald-500/5 flex items-center justify-center">
                                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                              </span>
                              {{ t }}
                           </button>
                        }
                     </div>
                  </div>

                  <!-- Global Duration -->
                  <div class="p-5 bg-black/40 rounded-2xl border border-gray-800">
                     <div class="flex justify-between items-center mb-3">
                        <label class="text-[9px] font-black text-gray-600 uppercase tracking-widest">Global Blend TX</label>
                        <span class="text-[9px] font-mono text-emerald-400 font-black">0.5s</span>
                     </div>
                     <input type="range" min="0.1" max="2.0" step="0.1" value="0.5" class="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500">
                  </div>

                  <!-- Sequence Action -->
                  <div class="pt-4 border-t border-gray-800/50">
                     @if (vm.status === 'idle' || vm.status === 'error') {
                        <button (click)="onRender(vm)" [disabled]="vm.clips.length < 2"
                          class="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:opacity-90 disabled:opacity-30 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                          Compile Sequence
                        </button>
                     } @else if (vm.status === 'success') {
                        <div class="space-y-3" [@slideUp]>
                           <button (click)="onDownload(vm)" 
                             class="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                             Export Hybrid Pkg
                           </button>
                           @if (vm.outputSizeMB) {
                             <p class="text-center text-[9px] font-mono text-gray-500 uppercase tracking-widest">Hydrated Volume: {{ vm.outputSizeMB.toFixed(2) }} MB</p>
                           }
                        </div>
                     } @else {
                        <div class="h-14 w-full bg-gray-800/20 rounded-2xl flex items-center justify-center border border-dashed border-gray-800 opacity-50">
                           <span class="text-[10px] font-mono text-gray-600 uppercase tracking-widest animate-pulse">Blending Temporal Edges...</span>
                        </div>
                     }
                  </div>
               </div>

               <!-- Status Gauge -->
               <div class="w-full lg:w-[320px] bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl overflow-hidden relative">
                  @if (vm.status === 'processing') {
                     <app-progress-ring [progress]="vm.progress" [status]="'XFADE'"></app-progress-ring>
                     <div class="mt-6 flex flex-col items-center text-center">
                        <p class="text-emerald-400 font-mono text-[10px] uppercase tracking-[0.4em] font-black animate-pulse">Flux Kernel Mapping</p>
                        <p class="text-gray-500 font-mono text-[8px] uppercase mt-1">GLSL Kernel Diffusion Active</p>
                     </div>
                  } @else {
                     <div class="flex flex-col items-center gap-6 opacity-40">
                        <div class="w-20 h-20 rounded-full border border-gray-800 flex items-center justify-center">
                           <svg class="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        </div>
                        <p class="text-[9px] font-black text-white/50 uppercase tracking-[0.4em] text-center italic">Sequence_Engine_Idle</p>
                     </div>
                  }
                  <div class="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent pointer-events-none"></div>
               </div>
            </div>
        </div>
      }
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
export class TransitionsComponent implements OnDestroy {
  private store = inject(Store);
  private fluxService = inject(TransitionsService);
  private subscription = new Subscription();
  
  readonly vm$ = this.store.select(selectTransitionsState);

  onAddClip(file: File): void { this.store.dispatch(TransitionsActions.addClip({ file })); }
  onRemoveClip(index: number): void { this.store.dispatch(TransitionsActions.removeClip({ index })); }
  onSetTrans(index: number, trans: any): void { this.store.dispatch(TransitionsActions.setTransition({ index, transition: { ...trans, type: 'fade' } })); }
  onApplyAll(type: string): void { this.store.dispatch(TransitionsActions.applyAllTransitions({ transition: { type, duration: 0.5 } })); }

  onAddBatch(): void {
    const input = document.createElement('input');
    input.type = 'file'; input.multiple = true; input.accept = 'video/*';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) Array.from(files).forEach(f => this.onAddClip(f));
    };
    input.click();
  }

  onRender(state: TransitionsState): void {
    if (state.clips.length < 2) return;
    
    this.store.dispatch(TransitionsActions.startProcessing());
    
    this.subscription.add(
      this.fluxService.process({
        clips: state.clips,
        transitions: state.transitions
      }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') {
            this.store.dispatch(TransitionsActions.updateProgress({ progress: msg.value ?? 0 }));
          } else if (msg.type === 'complete') {
            const blob = new Blob([msg.data as BlobPart], { type: 'video/mp4' });
            this.store.dispatch(TransitionsActions.processingSuccess({ 
              outputBlob: blob,
              outputSizeMB: blob.size / (1024 * 1024)
            }));
          }
        },
        error: (err) => {
          this.store.dispatch(TransitionsActions.processingFailure({ 
            errorCode: 'FFMPEG_COMMAND_FAILED', 
            message: err.message ?? 'CineXfade kernel blending calculation aborted.',
            retryable: true
          }));
        }
      })
    );
  }

  onDownload(state: TransitionsState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const filename = this.fluxService.getOutputFilename();
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  onReset(): void {
    this.store.dispatch(TransitionsActions.resetState());
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}