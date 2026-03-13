import { Component, ChangeDetectionStrategy, inject, OnDestroy, signal } from '@angular/core';
import { AsyncPipe, DecimalPipe, NgClass } from '@angular/common';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger, query, stagger } from '@angular/animations';
import { MergerActions, selectMergerState, selectMergerFiles } from './merger.store';
import { AudioDropZoneComponent } from '../shared/components/audio-drop-zone/audio-drop-zone.component';
import { ExportFormat } from '../shared/types/audio.types';

@Component({
  selector: 'app-merger',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, DecimalPipe, NgClass, AudioDropZoneComponent],
  animations: [
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0 }), animate('400ms ease-out', style({ opacity: 1 }))])]),
    trigger('slideUp', [transition(':enter', [style({ opacity: 0, transform: 'translateY(20px)' }), animate('500ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0)' }))])]),
    trigger('listAnimation', [
      transition('* <=> *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(-10px)' }),
          stagger('50ms', [animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))])
        ], { optional: true }),
        query(':leave', [
          stagger('50ms', [animate('300ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))])
        ], { optional: true })
      ])
    ])
  ],
  template: `
    <div class="h-full w-full bg-[#0a0a0f] text-white p-6 flex flex-col overflow-y-auto" [@fadeIn]>
      
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-violet-500 to-fuchsia-400 bg-clip-text text-transparent drop-shadow-md tracking-tight">
            🔗 Audio Merger
          </h2>
          <p class="text-gray-400 text-sm mt-1 uppercase tracking-widest">Combine multiple tracks into a single master mix</p>
        </div>
        @if ((state$ | async)?.inputFiles?.length) {
          <button (click)="onReset()" class="px-4 py-2 bg-gray-900 hover:bg-red-900/40 text-gray-400 hover:text-red-400 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors border border-gray-800">
            Clear All
          </button>
        }
      </div>

      @if (state$ | async; as state) {
        
        <div class="flex-1 flex flex-col lg:flex-row gap-6 min-h-0" [@fadeIn]>
            
          <!-- Left Panel: Track List -->
          <div class="flex-1 flex flex-col gap-6">
            
            <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col h-full min-h-[400px]">
              
              <div class="flex justify-between items-center mb-6">
                 <h3 class="text-xs font-black text-gray-500 uppercase tracking-widest">Track Sequence ({{ state.inputFiles.length }})</h3>
                 <app-audio-drop-zone (fileSelected)="onFilesAdded($event)"></app-audio-drop-zone>
              </div>

              @if (state.inputFiles.length === 0) {
                 <div class="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-xl bg-gray-900/20 p-8">
                   <div class="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500 mb-4">
                     <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                   </div>
                   <p class="text-gray-400 font-medium">Add files to start merging</p>
                   <p class="text-gray-600 text-xs mt-2 uppercase tracking-widest">Supports multiple select</p>
                 </div>
              } @else {
                 <div class="flex-1 overflow-y-auto pr-2 space-y-3" [@listAnimation]="state.inputFiles.length">
                   @for (file of state.inputFiles; track file.name + $index) {
                     <div class="group flex items-center gap-4 bg-gray-900/80 border border-gray-800 p-4 rounded-xl hover:border-violet-500/50 transition-colors">
                       
                       <div class="flex flex-col gap-1 items-center justify-center text-gray-600 cursor-ns-resize hover:text-white px-2">
                         <div class="w-1 h-1 bg-current rounded-full"></div>
                         <div class="w-1 h-1 bg-current rounded-full"></div>
                         <div class="w-1 h-1 bg-current rounded-full"></div>
                       </div>
                       
                       <div class="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 text-sm font-black">
                         {{ $index + 1 }}
                       </div>
                       
                       <div class="flex-1 min-w-0">
                         <p class="text-white font-bold text-sm truncate">{{ file.name }}</p>
                         <p class="text-gray-500 text-xs">{{ (file.size / 1024 / 1024) | number:'1.2-2' }} MB</p>
                       </div>
                       
                       <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button (click)="moveUp($index)" [disabled]="$index === 0" class="p-2 text-gray-500 hover:text-white disabled:opacity-30">▲</button>
                         <button (click)="moveDown($index)" [disabled]="$index === state.inputFiles.length - 1" class="p-2 text-gray-500 hover:text-white disabled:opacity-30">▼</button>
                         <button (click)="removeFile($index)" class="p-2 text-gray-500 hover:text-red-400 ml-2">✕</button>
                       </div>
                     </div>
                   }
                 </div>
              }
            </div>
            
          </div>

          <!-- Right Panel: Configurations & Output -->
          <div class="w-full lg:w-96 flex flex-col gap-6">
            
            <!-- Merger Settings -->
            <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col gap-6">
               <h3 class="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-4">Merge Settings</h3>
               
               <div>
                  <label class="block text-xs text-gray-400 uppercase tracking-widest mb-3 font-bold">Transition Type</label>
                  <div class="flex rounded-lg border border-gray-700 overflow-hidden">
                    <button (click)="transitionType.set('none')" [ngClass]="{'bg-violet-600 text-white': transitionType() === 'none', 'bg-gray-900 text-gray-500': transitionType() !== 'none'}" class="flex-1 py-2 text-xs font-bold transition-colors">Direct</button>
                    <button (click)="transitionType.set('crossfade')" [ngClass]="{'bg-violet-600 text-white': transitionType() === 'crossfade', 'bg-gray-900 text-gray-500': transitionType() !== 'crossfade'}" class="flex-1 py-2 text-xs font-bold transition-colors border-x border-gray-700">Crossfade</button>
                    <button (click)="transitionType.set('gap')" [ngClass]="{'bg-violet-600 text-white': transitionType() === 'gap', 'bg-gray-900 text-gray-500': transitionType() !== 'gap'}" class="flex-1 py-2 text-xs font-bold transition-colors">Gap</button>
                  </div>
               </div>

               @if (transitionType() === 'crossfade') {
                 <div [@fadeIn]>
                   <label class="block text-xs text-gray-400 uppercase tracking-widest mb-2 font-bold">Crossfade Duration (ms)</label>
                   <input type="range" min="100" max="5000" step="100" [value]="crossfadeMs()" (input)="onCrossfadeChange($event)" class="w-full accent-violet-500 cursor-pointer">
                   <div class="text-right text-xs text-violet-400 font-mono mt-1">{{ crossfadeMs() }} ms ({{ crossfadeMs() / 1000 }}s)</div>
                 </div>
               }

               @if (transitionType() === 'gap') {
                 <div [@fadeIn]>
                   <label class="block text-xs text-gray-400 uppercase tracking-widest mb-2 font-bold">Silence Gap (ms)</label>
                   <input type="range" min="100" max="10000" step="100" [value]="gapMs()" (input)="onGapChange($event)" class="w-full accent-violet-500 cursor-pointer">
                   <div class="text-right text-xs text-violet-400 font-mono mt-1">{{ gapMs() }} ms ({{ gapMs() / 1000 }}s)</div>
                 </div>
               }

               <div>
                 <label class="block text-xs text-gray-400 uppercase tracking-widest mb-3 font-bold">Output Format</label>
                 <select [value]="outputFormat()" (change)="onFormatChange($event)" class="w-full bg-gray-900 border border-gray-700 text-white font-bold text-sm rounded-lg px-4 py-3 outline-none focus:border-violet-500 transition-colors">
                   <option value="mp3">MP3 Audio</option>
                   <option value="wav">WAV (Lossless)</option>
                   <option value="aac">AAC / M4A</option>
                   <option value="ogg">OGG Vorbis</option>
                 </select>
               </div>

               <button (click)="onProcess(state)" 
                   [disabled]="state.status === 'processing' || state.inputFiles.length < 2"
                   class="w-full py-4 mt-2 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                   [class]="state.status === 'processing' ? 'bg-gray-800 text-violet-500' : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 text-white shadow-lg active:scale-95'">
                   
                   @if (state.status === 'processing') {
                     <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                     {{ state.progress }}%
                   } @else {
                     🔗 Merge Audio Tracks
                   }
               </button>
            </div>

            <!-- Terminal Logs -->
            @if (state.status === 'processing' || state.logs.length > 0) {
              <div class="bg-black/80 rounded-2xl border border-gray-800 p-4 h-48 overflow-y-auto font-mono text-[10px] text-gray-500 flex flex-col gap-1" [@fadeIn]>
                @for (log of state.logs; track $index) {
                  <div><span class="text-violet-500/50">[{{ $index }}]</span> {{ log }}</div>
                }
              </div>
            }

            <!-- Done Dialog -->
            @if (state.status === 'done' && state.outputBlob) {
              <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex flex-col items-center gap-4 text-center" [@slideUp]>
                <div class="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl">✅</div>
                <div>
                  <p class="text-white font-black text-lg">Merge Successful!</p>
                  <p class="text-emerald-400 text-sm mt-1">{{ state.outputSizeMB | number:'1.2-2' }} MB • {{ outputFormat().toUpperCase() }}</p>
                </div>
                <audio [src]="getBlobUrl(state.outputBlob)" controls class="w-full mt-2 h-10 outline-none"></audio>
                <button (click)="onDownload(state)" class="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                  Download Master Track
                </button>
              </div>
            }

            @if (state.status === 'error') {
               <div class="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm" [@fadeIn]>
                 <span class="font-bold">Error:</span> {{ state.errorMessage }}
               </div>
            }

          </div>
        </div>
      }
    </div>
  `,
  styles: [`:host { display: block; height: 100%; }`]
})
export class MergerComponent implements OnDestroy {
  private store = inject(Store);
  readonly state$ = this.store.select(selectMergerState);
  
  outputFormat = signal<ExportFormat>('mp3');
  transitionType = signal<'none' | 'crossfade' | 'gap'>('none');
  crossfadeMs = signal<number>(1000); // 1 sec default
  gapMs = signal<number>(2000); // 2 sec default
  
  private cachedBlobUrls = new Map<Blob, string>();

  onFilesAdded(files: File[]): void {
    if (files.length > 0) this.store.dispatch(MergerActions.addFiles({ files }));
  }

  removeFile(index: number) {
    this.store.dispatch(MergerActions.removeFile({ index }));
  }

  moveUp(index: number) {
    if (index > 0) this.store.dispatch(MergerActions.reorderFiles({ previousIndex: index, currentIndex: index - 1 }));
  }

  moveDown(index: number) {
    // Note: Can't easily peek state length without subscribing, but disabled buttons prevent out of bounds.
    this.store.dispatch(MergerActions.reorderFiles({ previousIndex: index, currentIndex: index + 1 }));
  }

  onFormatChange(e: Event) {
    this.outputFormat.set((e.target as HTMLSelectElement).value as ExportFormat);
  }

  onCrossfadeChange(e: Event) {
    this.crossfadeMs.set(parseInt((e.target as HTMLInputElement).value, 10));
  }

  onGapChange(e: Event) {
    this.gapMs.set(parseInt((e.target as HTMLInputElement).value, 10));
  }

  onProcess(state: any): void {
    if (state.status === 'processing') return;
    
    let xfade = 0;
    let gap = 0;
    
    if (this.transitionType() === 'crossfade') xfade = this.crossfadeMs();
    if (this.transitionType() === 'gap') gap = this.gapMs();

    this.store.dispatch(MergerActions.startProcessing({ 
      format: this.outputFormat(),
      crossfadeMs: xfade,
      gapMs: gap
    }));
  }

  onDownload(state: any): void {
    if (!state.outputBlob) return;
    const url = this.getBlobUrl(state.outputBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omni_merged_mix_${Date.now()}.${this.outputFormat()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  getBlobUrl(blob: Blob): string {
    if (this.cachedBlobUrls.has(blob)) return this.cachedBlobUrls.get(blob)!;
    const url = URL.createObjectURL(blob);
    this.cachedBlobUrls.set(blob, url);
    return url;
  }

  onReset(): void {
    this.cachedBlobUrls.forEach(url => URL.revokeObjectURL(url));
    this.cachedBlobUrls.clear();
    this.store.dispatch(MergerActions.resetState());
  }

  ngOnDestroy(): void {
    this.onReset();
  }
}
