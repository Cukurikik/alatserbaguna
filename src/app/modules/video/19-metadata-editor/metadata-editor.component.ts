import { fadeIn, slideUp, slideInRight, popIn, staggerFade, buttonState } from '../../../shared/animations';
import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { MetadataEditorActions, selectMetadataEditorState, MetadataEditorState, MetadataFields } from './metadata-editor.store';
import { MetadataEditorService } from './metadata-editor.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-metadata-editor',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, ProgressRingComponent, FormsModule],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Registry Engine
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Container Header Mutation: Metadata v1.0</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.inputFile) {
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
        
        <!-- Pillar 5: I/O — Input State -->
        @if (!vm.inputFile) {
          <div class="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full" [@slideUp]>
            <app-file-drop-zone accept="video/*" (fileDropped)="onFileSelected($event)"></app-file-drop-zone>
            
            <div class="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
               <div class="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Box Header Mutation</h4>
                    <p class="text-xs text-gray-500 mt-1">Direct manipulation of Moov/Atom headers without re-encoding video streams. Ultra-fast processing.</p>
                  </div>
               </div>
               <div class="p-6 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0014 20.243V20.2a9.96 9.96 0 00-2.42-6.68a9.96 9.96 0 00-6.19 2.5a5.002 5.002 0 01-1.39-4.02m0 0a10.003 10.003 0 0114.54-6.4M12 7V3m0 0L9 6m3-3l3 3"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Stream Privacy</h4>
                    <p class="text-xs text-gray-500 mt-1">Anonymize video files by stripping all global metadata tags, timestamps, and encoder traces.</p>
                  </div>
               </div>
            </div>
          </div>
        }

        <!-- Pillar 4: Component Logic Area -->
        @if (vm.inputFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8" [@fadeIn]>
            
            <!-- Left: Metadata Manifest -->
            <div class="flex-1 flex flex-col gap-6 overflow-hidden">
               <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-6 flex flex-col h-full shadow-2xl overflow-hidden">
                  <div class="flex items-center justify-between mb-6">
                     <h3 class="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 italic">
                        <span class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
                        Registry_Manifest_v1.0
                     </h3>
                     <div class="flex items-center gap-2">
                        <button (click)="onToggleStrip()" [class]="vm.stripAll ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-gray-800/40 text-gray-500 border-gray-700'"
                           class="px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-tighter transition-all">
                           {{ vm.stripAll ? 'STRIP_ACTIVE' : 'STRIP_BYPASS' }}
                        </button>
                     </div>
                  </div>

                  <!-- Editable Fields Grid -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto custom-scrollbar pr-2 pb-4">
                     @for (field of fieldLabels; track field.key) {
                        <div class="space-y-2 bg-black/20 p-4 rounded-2xl border border-gray-800/50 hover:border-emerald-500/30 transition-colors group">
                           <label class="block text-[10px] font-black text-gray-600 uppercase tracking-widest font-mono group-hover:text-emerald-400/60 transition-colors">{{ field.label }}</label>
                           <input type="text" [value]="vm.editedFields[field.key]" (input)="onUpdateField(field.key, $event)"
                             class="w-full bg-transparent border-none focus:ring-0 text-white text-xs font-mono placeholder:text-gray-700"
                             [placeholder]="'ENTER_' + field.key.toUpperCase() + '_ID...'">
                        </div>
                     }
                  </div>

                  <!-- Status Area -->
                  @if (vm.status === 'processing') {
                     <div class="mt-auto pt-6 border-t border-gray-800 flex items-center gap-6" [@fadeIn]>
                        <app-progress-ring [progress]="vm.progress"></app-progress-ring>
                        <div class="flex flex-col gap-1">
                           <span class="text-emerald-400 font-mono text-[10px] uppercase tracking-[0.3em] font-black animate-pulse">Mutating Atom Headers</span>
                           <span class="text-gray-500 font-mono text-[8px] uppercase">Re-mapping Metadata Dictionary</span>
                        </div>
                     </div>
                  } @else {
                     <div class="mt-auto pt-6 border-t border-gray-800 flex items-center justify-between font-mono">
                        <div class="flex flex-col gap-1">
                           <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest">Target Path</span>
                           <span class="text-gray-400 text-[10px] tracking-tighter">{{ vm.inputFile.name }}</span>
                        </div>
                        <div class="flex flex-col items-end gap-1 text-right">
                           <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest">Protocol</span>
                           <span class="text-emerald-500 text-[10px] font-black tracking-widest uppercase">atom_link_v2</span>
                        </div>
                     </div>
                  }
               </div>
            </div>

            <!-- Right: Logic & Result -->
            <div class="w-full lg:w-[380px] flex flex-col gap-6">
               <!-- RAW Manifest Preview -->
               <div class="bg-gray-950 border border-emerald-500/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                  <div class="flex flex-col gap-4">
                     <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-emerald-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
                        <span class="text-[10px] font-black text-white/40 uppercase tracking-widest font-mono">Stream_Inspector_Raw</span>
                     </div>
                     <div class="h-[240px] w-full bg-black/40 rounded-xl p-4 overflow-y-auto custom-scrollbar font-mono text-[9px] text-emerald-500/40 leading-relaxed break-all">
                        {{ vm.rawJson || 'awaiting_stream_attachment...' }}
                     </div>
                  </div>
                  <div class="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent pointer-events-none"></div>
               </div>

               <!-- Action Area -->
               <div class="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 flex flex-col gap-4 shadow-2xl">
                  @if (vm.status === 'idle' || vm.status === 'error') {
                     <button (click)="onCommit(vm)"
                       class="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:opacity-90 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 font-mono">
                       <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                       Commit Changes
                     </button>
                  } @else if (vm.status === 'success') {
                     <div class="space-y-3" [@slideUp]>
                        <button (click)="onDownload(vm)" 
                          class="w-full bg-white text-gray-950 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-white/10 transition-all flex items-center justify-center gap-3 active:scale-95">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                          Export Tagged
                        </button>
                        @if (vm.outputSizeMB) {
                           <p class="text-center text-[9px] font-mono text-gray-500 uppercase tracking-widest">Mutation Size: {{ vm.outputSizeMB.toFixed(2) }} MB</p>
                        }
                        <button (click)="onReset()" class="w-full text-center text-[9px] font-black text-gray-600 hover:text-white uppercase py-2 transition-colors">Start New Session</button>
                     </div>
                  } @else {
                     <div class="h-14 w-full bg-gray-800/20 rounded-2xl flex items-center justify-center border border-dashed border-gray-800 opacity-50">
                        <span class="text-[10px] font-mono text-gray-600 uppercase tracking-widest animate-pulse">Syncing Registry Atom...</span>
                     </div>
                  }

                  @if (vm.status === 'error') {
                     <div class="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4" [@fadeIn]>
                        <div class="flex-1">
                          <p class="text-white font-black text-xs uppercase tracking-tight">Access Violation</p>
                          <p class="text-rose-400 font-mono text-[9px] mt-1 pr-2 leading-relaxed opacity-80">{{ vm.errorMessage || 'Unknown atom re-write rejection' }}</p>
                        </div>
                     </div>
                  }
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
export class MetadataEditorComponent implements OnDestroy {
  private store = inject(Store);
  private registryService = inject(MetadataEditorService);
  private subscription = new Subscription();
  
  readonly vm$ = this.store.select(selectMetadataEditorState);
  readonly fieldLabels: { key: keyof MetadataFields; label: string }[] = [
    { key: 'title', label: 'Meta_Title' },
    { key: 'artist', label: 'Artist_ID' },
    { key: 'album', label: 'Stream_Album' },
    { key: 'year', label: 'Stamp_Date' },
    { key: 'genre', label: 'Stream_Genre' },
    { key: 'description', label: 'Manifest_Desc' },
    { key: 'comment', label: 'Registry_Note' }
  ];

  onFileSelected(file: File): void {
    this.store.dispatch(MetadataEditorActions.loadFile({ file }));
    
    // Simulate initial probing for UI
    setTimeout(() => {
      this.store.dispatch(MetadataEditorActions.loadMetaSuccess({
        meta: {
          filename: file.name,
          fileSizeMB: file.size / (1024 * 1024),
          duration: 0,
          width: 0, height: 0, fps: 0,
          codec: 'probed', audioCodec: 'probed',
          audioBitrate: 0, videoBitrate: 0,
          hasAudio: true, aspectRatio: 'N/A'
        },
        rawJson: JSON.stringify({
          format: { filename: file.name, size: file.size, tags: { title: 'Probe Result' } },
          streams: [{ codec_name: 'h264', codec_type: 'video' }]
        }, null, 2)
      }));
    }, 1000);
  }

  onUpdateField(key: keyof MetadataFields, e: Event): void {
    const value = (e.target as HTMLInputElement).value;
    this.store.dispatch(MetadataEditorActions.updateField({ key, value }));
  }

  onToggleStrip(): void { this.store.dispatch(MetadataEditorActions.toggleStripAll()); }

  onCommit(state: MetadataEditorState): void {
    if (!state.inputFile) return;
    
    this.store.dispatch(MetadataEditorActions.startProcessing());
    
    this.subscription.add(
      this.registryService.process({
        file: state.inputFile,
        editedFields: state.editedFields,
        stripAll: state.stripAll
      }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') {
            this.store.dispatch(MetadataEditorActions.updateProgress({ progress: msg.value ?? 0 }));
          } else if (msg.type === 'complete') {
            const blob = new Blob([msg.data as BlobPart], { type: 'video/mp4' });
            this.store.dispatch(MetadataEditorActions.processingSuccess({ 
              outputBlob: blob,
              outputSizeMB: blob.size / (1024 * 1024)
            }));
          }
        },
        error: (err) => {
          this.store.dispatch(MetadataEditorActions.processingFailure({ 
            errorCode: 'FFMPEG_COMMAND_FAILED', 
            message: err.message ?? 'Registry mutation kernel calculation aborted.',
            retryable: true
          }));
        }
      })
    );
  }

  onDownload(state: MetadataEditorState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const filename = this.registryService.getOutputFilename(state.inputFile?.name || 'video');
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  onReset(): void {
    this.store.dispatch(MetadataEditorActions.resetState());
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}