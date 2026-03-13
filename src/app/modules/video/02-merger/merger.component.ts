import { fadeIn, slideUp, slideInRight, popIn, staggerFade, buttonState } from '../../../shared/animations';
import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { MergerActions, selectMergerState, MergerState } from './merger.store';
import { MergerService } from './merger.service';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { ExportPanelComponent } from '../shared/components/export-panel/export-panel.component';
import { animate, style, transition, trigger, query, stagger } from '@angular/animations';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-merger',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, ProgressRingComponent, ExportPanelComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-purple-400 via-fuchsia-500 to-pink-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Chronos Engine
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Seamless Stream Fusion: Temporal Concatenation v1.0</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.inputFiles.length > 0) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-purple-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-purple-950/30 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </span>
              Purge Workspace
            </button>
          }
        }
      </div>

      @if (vm$ | async; as vm) {
        
        <div
          role="button"
          tabindex="0"
          class="relative border-2 border-dashed border-gray-800/50 hover:border-purple-500/50 rounded-[2.5rem] p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-700 bg-gray-900/30 hover:bg-purple-500/5 hover:shadow-[0_0_50px_rgba(192,132,252,0.1)] mb-8 group overflow-hidden"
          (click)="fileInput.click()"
          (dragover)="$event.preventDefault()"
          (drop)="onDrop($event)">
          
          <div class="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
          
          <div class="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/10 flex items-center justify-center mb-8 border border-purple-500/20 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
            <svg class="h-10 w-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
            </svg>
          </div>
          <span class="text-white font-black text-2xl tracking-tighter uppercase italic">Inject_Fragments</span>
          <span class="text-gray-500 text-[10px] mt-4 font-mono tracking-[0.4em] opacity-60 uppercase">Streaming_Bus • MP4_Stream • WEBM_Payload</span>
          <input #fileInput type="file" accept="video/*" multiple class="hidden" (change)="onFilesSelected($event)">
        </div>

        @if (vm.inputFiles.length > 0) {
          <div class="flex flex-col gap-4 mb-10" [@listAnimation]="vm.inputFiles.length">
            <div class="flex items-center justify-between px-4">
               <h3 class="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] italic opacity-60">Linear_Fusion_Chain ({{ vm.inputFiles.length }})</h3>
               <span class="text-[10px] text-purple-500/60 font-mono font-black uppercase tracking-widest italic">Cumulative_Payload: {{ calculateTotalSize(vm.inputFiles) }} MB</span>
            </div>
            
            @for (file of vm.inputFiles; track file.name + $index; let i = $index) {
              <div class="flex items-center gap-6 bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-[2rem] p-5 group hover:border-purple-500/40 transition-all hover:bg-gray-800/60 shadow-xl overflow-hidden relative">
                <div class="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                   <span class="text-[8px] font-black text-gray-600 uppercase tracking-widest font-mono">NODE_{{ i.toString().padStart(2, '0') }}</span>
                </div>
                
                <div class="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/10 flex items-center justify-center text-purple-400 font-black text-sm shrink-0 shadow-inner group-hover:scale-110 transition-transform">{{ i + 1 }}</div>
                <div class="flex-1 min-w-0">
                  <p class="text-white font-black text-sm truncate pr-4 tracking-tight uppercase">{{ file.name }}</p>
                  <p class="text-gray-500 text-[9px] font-mono mt-2 uppercase tracking-widest opacity-60 italic">{{ (file.size / 1024 / 1024) | number:'1.2-2' }} MB_SEGMENT</p>
                </div>
                
                <div class="flex items-center gap-4">
                   <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                     <button (click)="moveUp(i)" [disabled]="i === 0" 
                       class="text-gray-500 hover:text-white disabled:opacity-10 p-2.5 rounded-xl bg-gray-950 border border-gray-800 hover:border-purple-500/40 transition-all">
                       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7"/></svg>
                     </button>
                     <button (click)="moveDown(i, vm)" [disabled]="i === vm.inputFiles.length - 1"
                       class="text-gray-500 hover:text-white disabled:opacity-10 p-2.5 rounded-xl bg-gray-950 border border-gray-800 hover:border-purple-500/40 transition-all">
                       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
                     </button>
                   </div>
                   
                   <button (click)="removeFile(i)" 
                     class="text-gray-600 hover:text-rose-500 transition-all p-3.5 rounded-2xl bg-rose-500/0 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 rotate-12 hover:rotate-0">
                     <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                   </button>
                </div>
              </div>
            }
          </div>
        }

        <div class="flex flex-col lg:flex-row gap-8 items-start">
          <div class="flex-1 w-full">
             <div class="bg-gray-900/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-gray-800 shadow-2xl relative overflow-hidden">
                <div class="absolute top-0 left-0 p-4 opacity-10">
                   <svg class="w-20 h-20 text-white font-black italic" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v2h-2v-2zm0-10h2v8h-2V6z"/></svg>
                </div>
                <app-export-panel
                  [disabled]="vm.status === 'processing' || vm.inputFiles.length < 2"
                  (formatChange)="onFormatSelected($event)"
                  (exportClicked)="onStartMerge(vm)">
                </app-export-panel>
                @if (vm.inputFiles.length < 2 && vm.inputFiles.length > 0) {
                  <div class="mt-6 px-6 py-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
                     <svg class="w-6 h-6 text-amber-500 grow-0 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                     <p class="text-amber-200 text-[10px] font-black uppercase tracking-[0.2em] italic leading-relaxed">Fusion_Incomplete: Matrix requires minimum 02 fragments to energize.</p>
                  </div>
                }
             </div>
          </div>

          <div class="w-full lg:w-[400px] shrink-0">
            @if (vm.status === 'processing') {
              <div class="bg-gray-900/40 backdrop-blur-md rounded-[2.5rem] p-10 border border-gray-800 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden min-h-[400px]" [@fadeIn]>
                <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 shadow-[0_0_20px_rgba(192,132,252,0.5)]"></div>
                <app-progress-ring [progress]="vm.progress" [status]="'FUSING_STREAMS'"></app-progress-ring>
                <div class="mt-10 flex flex-col items-center gap-2">
                   <p class="text-purple-400 font-black font-mono text-[10px] tracking-[0.4em] animate-pulse italic">Chronos_Core_Active</p>
                   <p class="text-gray-500 text-[8px] font-mono uppercase tracking-[0.2em] opacity-60">Merging {{ vm.inputFiles.length }} Neural Payloads...</p>
                </div>
              </div>
            } @else if (vm.status === 'success') {
              <div class="bg-gray-900/40 backdrop-blur-md border border-emerald-500/30 rounded-[2.5rem] p-10 flex flex-col items-center justify-center shadow-2xl min-h-[400px]" [@slideUp]>
                <div class="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <svg class="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                </div>
                <h3 class="text-2xl font-black text-white mb-2 uppercase tracking-tighter italic">Fusion Unified</h3>
                <p class="text-emerald-400/60 text-[10px] font-black font-mono mb-10 tracking-[0.3em] uppercase italic">{{ vm.outputSizeMB | number:'1.2-2' }} MB Reconstructed</p>
                
                <button class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 group mb-6"
                  (click)="onDownload(vm)">
                  <svg class="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  Export Hybrid Stream
                </button>
                <button class="text-[9px] font-black uppercase text-gray-500 hover:text-white transition-all tracking-[0.3em] underline underline-offset-8 decoration-gray-800 hover:decoration-gray-500 italic" (click)="onReset()">Purge_Workspace</button>
              </div>
            } @else if (vm.status === 'error') {
              <div class="bg-gray-900/40 backdrop-blur-md border border-rose-500/20 rounded-[2.5rem] p-10 flex flex-col items-center justify-center min-h-[400px]" [@fadeIn]>
                <div class="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6 text-rose-500 shadow-lg">
                   <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <p class="text-white font-black text-sm uppercase mb-2 tracking-tight italic">Temporal_Divergence</p>
                <p class="text-rose-400/80 text-[10px] text-center font-black uppercase tracking-widest leading-relaxed italic opacity-80">{{ vm.errorMessage || 'Unknown engine failure' }}</p>
                @if (vm.retryable) {
                  <button (click)="onStartMerge(vm)" class="mt-10 px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95">Retry_Fusion_Matrix</button>
                }
              </div>
            } @else {
               <div class="h-full bg-gray-950/20 border-2 border-dashed border-gray-800 rounded-[2.5rem] p-10 flex flex-col items-center justify-center opacity-30 min-h-[400px]">
                  <div class="w-20 h-20 rounded-full border border-gray-800 flex items-center justify-center relative overflow-hidden group mb-6">
                     <svg class="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                     <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-purple-500/20 to-transparent"></div>
                  </div>
                  <p class="text-[9px] font-black text-white/50 uppercase tracking-[0.4em] italic leading-relaxed text-center">Chronos_Module_Standby<br>Awaiting_Bus_Fragments</p>
               </div>
            }
          </div>
        </div>
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
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger(50, [
            animate('300ms cubic-bezier(0.3, 0, 0, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MergerComponent implements OnDestroy {
  private store = inject(Store);
  private mergerService = inject(MergerService);
  private subscription = new Subscription();
  
  readonly vm$ = this.store.select(selectMergerState);

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.store.dispatch(MergerActions.addFiles({ files: Array.from(input.files) }));
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const files = Array.from(event.dataTransfer?.files ?? []).filter(f => f.type.startsWith('video/'));
    if (files.length) this.store.dispatch(MergerActions.addFiles({ files }));
  }

  calculateTotalSize(files: File[]): string {
    const bytes = files.reduce((acc, f) => acc + f.size, 0);
    return (bytes / (1024 * 1024)).toFixed(2);
  }

  removeFile(index: number): void { this.store.dispatch(MergerActions.removeFile({ index })); }
  moveUp(index: number): void { if (index > 0) this.store.dispatch(MergerActions.reorderFiles({ from: index, to: index - 1 })); }
  moveDown(index: number, vm: MergerState): void { if (index < vm.inputFiles.length - 1) this.store.dispatch(MergerActions.reorderFiles({ from: index, to: index + 1 })); }
  onFormatSelected(format: string): void { this.store.dispatch(MergerActions.setOutputFormat({ format })); }

  onStartMerge(state: MergerState): void {
    if (state.inputFiles.length < 2) return;
    
    this.store.dispatch(MergerActions.startProcessing());
    
    this.subscription.add(
      this.mergerService.process(state.inputFiles, state.outputFormat).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') {
            this.store.dispatch(MergerActions.updateProgress({ progress: msg.value ?? 0 }));
          } else if (msg.type === 'complete') {
            const blob = new Blob([msg.data as BlobPart], { type: `video/${state.outputFormat}` });
            this.store.dispatch(MergerActions.processingSuccess({ 
              outputBlob: blob,
              outputSizeMB: blob.size / (1024 * 1024)
            }));
          }
        },
        error: (err) => {
          this.store.dispatch(MergerActions.processingFailure({ 
            errorCode: 'FFMPEG_COMMAND_FAILED', 
            message: err.message ?? 'Concatenation failed. Check fragment temporal compatibility.',
            retryable: true
          }));
        }
      })
    );
  }

  onDownload(state: MergerState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const filename = this.mergerService.getOutputFilename(state.outputFormat);
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  onReset(): void { this.store.dispatch(MergerActions.resetState()); }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}