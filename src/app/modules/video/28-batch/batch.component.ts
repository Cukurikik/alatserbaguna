import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { BatchActions, selectBatchState, BatchState, BatchFileEntry } from './batch.store';
import { BatchService } from './batch.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger, query, stagger } from '@angular/animations';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-batch',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, FileDropZoneComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-blue-400 via-indigo-500 to-violet-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Hive Engine
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Parallel Stream Automation: Queue Logic v1.0</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.files.length > 0) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-indigo-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-indigo-950/30 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </span>
              Dispose Queue
            </button>
          }
        }
      </div>

      @if (vm$ | async; as vm) {
        
        <div class="flex-1 flex flex-col gap-8" [@fadeIn]>
            
            <!-- Overall Progress Gauge -->
            @if (vm.status !== 'idle' || vm.files.length > 0) {
               <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-8 shadow-xl relative overflow-hidden flex items-center gap-12" [@slideUp]>
                  <div class="shrink-0 relative">
                     <app-progress-ring [progress]="vm.overallProgress" [status]="vm.status.toUpperCase()"></app-progress-ring>
                     <div class="absolute inset-0 flex items-center justify-center pt-2">
                        <span class="text-[8px] font-black text-white/20 uppercase tracking-widest mt-12">Total_Load</span>
                     </div>
                  </div>

                  <div class="flex-1 flex flex-col gap-6">
                     <div class="flex flex-col gap-1">
                        <h4 class="text-white font-black text-xl uppercase tracking-tighter">Queue Orchestration</h4>
                        <p class="text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em] italic">Parallel Execution Pipeline Active</p>
                     </div>

                     <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div class="p-4 bg-black/40 rounded-xl border border-gray-800 flex flex-col items-center">
                           <span class="text-[8px] font-black text-gray-600 uppercase mb-1">Total_Nodes</span>
                           <span class="text-white text-lg font-black font-mono">{{ vm.files.length }}</span>
                        </div>
                        <div class="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex flex-col items-center">
                           <span class="text-[8px] font-black text-emerald-500/60 uppercase mb-1">Successful</span>
                           <span class="text-emerald-400 text-lg font-black font-mono">{{ getStats(vm).done }}</span>
                        </div>
                        <div class="p-4 bg-rose-500/5 rounded-xl border border-rose-500/10 flex flex-col items-center">
                           <span class="text-[8px] font-black text-rose-500/60 uppercase mb-1">Faults</span>
                           <span class="text-rose-400 text-lg font-black font-mono">{{ getStats(vm).error }}</span>
                        </div>
                        <div class="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10 flex flex-col items-center">
                           <span class="text-[8px] font-black text-indigo-500/60 uppercase mb-1">Queue_Ptr</span>
                           <span class="text-indigo-400 text-lg font-black font-mono">{{ vm.currentIndex + 1 }}</span>
                        </div>
                     </div>
                  </div>
                  <div class="absolute inset-x-0 bottom-0 h-1 bg-gray-800">
                     <div class="h-full bg-indigo-500 transition-all duration-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" [style.width.%]="vm.overallProgress"></div>
                  </div>
               </div>
            }

            <div class="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
               
               <!-- Queue List -->
               <div class="flex-1 bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col gap-6 relative">
                  <div class="flex justify-between items-center px-2">
                     <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest italic font-mono">Stream_Nodes_Queue</span>
                     <button (click)="onAddBatch()" class="text-[9px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors flex items-center gap-2">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                        Push_Packets
                     </button>
                  </div>

                  <div class="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-2" [@listAnimation]>
                     @for (entry of vm.files; track entry.file; let i = $index) {
                        <div [class]="getRowClass(entry.status)" class="p-4 rounded-2xl border transition-all flex items-center gap-4 group">
                           <div class="w-8 h-8 rounded-lg bg-black/60 flex items-center justify-center text-[10px] font-black font-mono shrink-0">
                              {{ i + 1 }}
                           </div>
                           <div class="flex-1 min-w-0">
                              <p class="text-xs font-black text-white truncate uppercase tracking-tight">{{ entry.file.name }}</p>
                              <div class="flex items-center gap-4 mt-1">
                                 <span class="text-[8px] font-mono text-gray-500 uppercase">{{ entry.file.size | number:'1.0-0' }} Bytes</span>
                                 @if (entry.status !== 'queued') {
                                    <span [class]="getStatusClass(entry.status)" class="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-black/40 border border-current opacity-60">
                                       {{ entry.status }}
                                    </span>
                                 }
                              </div>
                           </div>
                           @if (entry.status === 'processing') {
                              <div class="w-32 h-1.5 bg-black/60 rounded-full overflow-hidden">
                                 <div class="h-full bg-indigo-500 transition-all duration-300" [style.width.%]="entry.progress"></div>
                              </div>
                           }
                           @if (entry.status === 'error') {
                              <span class="text-[8px] font-black text-rose-500 uppercase tracking-widest animate-pulse">FAULT_REJECTED</span>
                           }
                           @if (entry.status === 'success') {
                              <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                           }
                        </div>
                     }

                     @if (vm.files.length === 0) {
                        <div class="flex-1 flex flex-col items-center justify-center py-20 text-center gap-6 opacity-30">
                           <div class="w-20 h-20 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center">
                              <svg class="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                           </div>
                           <p class="text-[10px] font-black uppercase tracking-[0.4em] italic mb-4">Awaiting_Packet_Ingress...</p>
                           <app-file-drop-zone (fileDropped)="onAddBatch()" class="w-full max-w-xs"></app-file-drop-zone>
                        </div>
                     }
                  </div>
               </div>

               <!-- Sidebar Control -->
               <div class="w-full lg:w-[350px] flex flex-col gap-6">
                  
                  <div class="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden">
                     
                     <!-- Configuration -->
                     <div class="flex flex-col gap-6">
                        <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none italic opacity-60">Hive_System_Protocol</label>
                        
                        <div class="grid grid-cols-2 gap-3">
                           <button (click)="onSetOp('compress')" [class]="vm.operation === 'compress' ? 'bg-indigo-500 text-indigo-950 font-black border-indigo-400' : 'bg-black/40 text-gray-500 border-gray-800'"
                             class="py-4 rounded-xl text-[10px] uppercase font-black transition-all border shadow-lg shadow-indigo-500/10">Pack</button>
                           <button (click)="onSetOp('convert')" [class]="vm.operation === 'convert' ? 'bg-indigo-500 text-indigo-950 font-black border-indigo-400' : 'bg-black/40 text-gray-500 border-gray-800'"
                             class="py-4 rounded-xl text-[10px] uppercase font-black transition-all border shadow-lg shadow-indigo-500/10">Mutate</button>
                        </div>

                        <div class="p-5 rounded-2xl bg-black/40 border border-gray-800">
                           <div class="flex justify-between items-center mb-4">
                              <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest">Hydration_CRF</span>
                              <span class="text-[10px] font-mono text-indigo-400 font-black">28</span>
                           </div>
                           <input type="range" min="18" max="32" value="28" class="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                        </div>
                     </div>

                     <!-- Trigger -->
                     <div class="pt-4 border-t border-gray-800/50">
                        @if (vm.status === 'idle' || vm.status === 'error') {
                           <button (click)="onProcess(vm)" [disabled]="vm.files.length === 0"
                             class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 disabled:opacity-20 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                             Energize Hive
                           </button>
                        } @else if (vm.status === 'success') {
                           <div class="space-y-4" [@slideUp]>
                              <button (click)="onDownloadAll(vm)" 
                                class="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                                Flush_All_Sinks
                              </button>
                              <div class="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex flex-col items-center gap-1">
                                 <span class="text-[8px] font-black text-emerald-500 uppercase tracking-widest leading-none">Load_Success_Metric</span>
                                 <span class="text-xs font-black text-white font-mono">{{ vm.outputSizeMB?.toFixed(2) }} MB TOTAL</span>
                              </div>
                           </div>
                        } @else {
                           <div class="h-16 w-full bg-gray-800/20 rounded-2xl flex flex-col items-center justify-center border border-dashed border-gray-800 opacity-50 gap-2">
                              <span class="text-[10px] font-mono text-gray-600 uppercase tracking-[0.3em] animate-pulse">Hydrating_Nodes...</span>
                              <div class="flex gap-1">
                                 <div class="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                 <div class="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                 <div class="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                              </div>
                           </div>
                        }
                     </div>
                  </div>

                  <div class="px-2 text-[9px] font-mono text-gray-600 uppercase italic opacity-40">
                     HIVE_NODE_ACTIVE_CORE_V1.0
                  </div>
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
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger(50, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BatchComponent implements OnDestroy {
  private store = inject(Store);
  private hiveService = inject(BatchService);
  private subscription = new Subscription();
  
  readonly vm$ = this.store.select(selectBatchState);

  onAddBatch(): void {
    const input = document.createElement('input');
    input.type = 'file'; input.multiple = true; input.accept = 'video/*';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) this.store.dispatch(BatchActions.setFiles({ files: Array.from(files) }));
    };
    input.click();
  }

  onRemoveFile(index: number): void {
     // Simplified implementation for now
  }

  onSetOp(operation: string): void { this.store.dispatch(BatchActions.setOperation({ operation })); }

  onProcess(state: BatchState): void {
    if (state.files.length === 0) return;
    this.store.dispatch(BatchActions.startQueue());
    this.processNext(state, 0);
  }

  private processNext(state: BatchState, index: number): void {
    if (index >= state.files.length) {
      const totalSize = state.outputBlobs.reduce((acc, b) => acc + b.size, 0) / (1024 * 1024);
      this.store.dispatch(BatchActions.queueComplete({ outputSizeMB: totalSize }));
      return;
    }

    const entry = state.files[index];
    this.store.dispatch(BatchActions.fileProcessingStart({ index }));

    this.subscription.add(
      this.hiveService.processFile({ 
        file: entry.file, 
        operation: state.operation, 
        config: state.operationConfig 
      }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') {
            this.store.dispatch(BatchActions.fileProgress({ index, progress: msg.value ?? 0 }));
          } else if (msg.type === 'complete') {
            const blob = new Blob([msg.data as BlobPart], { type: 'video/mp4' });
            this.store.dispatch(BatchActions.fileDone({ 
              index, 
              blob, 
              outputSizeMB: blob.size / (1024 * 1024) 
            }));
            
            // Sequential processing trigger
            this.vm$.subscribe(currentVm => {
              if (currentVm.status === 'processing' && currentVm.currentIndex === index) {
                this.processNext(currentVm, index + 1);
              }
            }).unsubscribe();
          }
        },
        error: (err) => {
          this.store.dispatch(BatchActions.fileError({ index, message: err.message ?? 'Node rejection' }));
          this.processNext(state, index + 1);
        }
      })
    );
  }

  onDownloadAll(state: BatchState): void {
    state.outputBlobs.forEach((blob, i) => {
      const url = URL.createObjectURL(blob);
      const filename = this.hiveService.getOutputFilename(state.files[i].file.name, state.operation);
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    });
  }

  onReset(): void {
    this.store.dispatch(BatchActions.resetState());
  }

  getStats(vm: BatchState) {
     return {
        done: vm.files.filter(f => f.status === 'success').length,
        error: vm.files.filter(f => f.status === 'error').length,
        queued: vm.files.filter(f => f.status === 'queued').length
     };
  }

  getRowClass(status: string): string {
     switch(status) {
        case 'processing': return 'bg-indigo-500/10 border-indigo-500/40 shadow-lg shadow-indigo-500/10';
        case 'success': return 'bg-emerald-500/5 border-emerald-500/20';
        case 'error': return 'bg-rose-500/5 border-rose-500/20';
        default: return 'bg-black/20 border-gray-800 hover:border-gray-700';
     }
  }

  getStatusClass(status: string): string {
     switch(status) {
        case 'processing': return 'text-indigo-400';
        case 'success': return 'text-emerald-500';
        case 'error': return 'text-rose-500';
        default: return 'text-gray-600';
     }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}