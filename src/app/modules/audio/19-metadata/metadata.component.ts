import { Component, ChangeDetectionStrategy, inject, OnDestroy, signal } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger } from '@angular/animations';
import { MetadataActions, selectMetadataState } from './metadata.store';
import { AudioDropZoneComponent } from '../shared/components/audio-drop-zone/audio-drop-zone.component';
import { AudioTags } from './metadata.schema';

@Component({
  selector: 'app-metadata',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, DecimalPipe, AudioDropZoneComponent],
  animations: [
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0 }), animate('400ms ease-out', style({ opacity: 1 }))])]),
    trigger('slideUp', [transition(':enter', [style({ opacity: 0, transform: 'translateY(20px)' }), animate('500ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0)' }))])]),
  ],
  template: `
    <div class="h-full w-full bg-[#0a0a0f] text-white p-6 flex flex-col overflow-y-auto" [@fadeIn]>
      <div class="flex justify-between items-center mb-8">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-indigo-400 to-violet-500 bg-clip-text text-transparent tracking-tight">🏷️ Metadata Editor</h2>
          <p class="text-gray-400 text-sm mt-1 uppercase tracking-widest">Edit ID3, Vorbis & FLAC audio tags</p>
        </div>
        @if ((state$ | async)?.inputFile) {
          <button (click)="onReset()" class="px-4 py-2 bg-gray-900 hover:bg-red-900/40 text-gray-400 hover:text-red-400 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors border border-gray-800">Reset</button>
        }
      </div>

      @if (state$ | async; as state) {
        @if (!state.inputFile) {
          <div class="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full py-12" [@slideUp]>
            <app-audio-drop-zone (fileSelected)="onFileSelected($event)"></app-audio-drop-zone>
          </div>
        } @else {
          <div class="flex-1 flex flex-col lg:flex-row gap-6" [@fadeIn]>
            <!-- Tag Form -->
            <div class="flex-1 flex flex-col gap-4">
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-5 flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-xl">🏷️</div>
                <div>
                  <h3 class="font-bold">{{ state.inputFile.name }}</h3>
                  <p class="text-xs text-gray-500 font-mono mt-1">{{ (state.inputFile.size / 1024 / 1024) | number:'1.2-2' }} MB</p>
                </div>
              </div>

              <!-- Strip Toggle -->
              <div class="bg-[#12121a] rounded-2xl border p-4 flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                   tabindex="0"
                   [class]="state.stripAll ? 'border-rose-500/40' : 'border-gray-800'"
                   (keydown.enter)="onToggleStrip()"
                   (click)="onToggleStrip()">
                <div>
                  <h4 class="font-bold text-sm" [class]="state.stripAll ? 'text-rose-400' : 'text-gray-300'">🗑️ Strip All Metadata</h4>
                  <p class="text-xs text-gray-500 mt-1">Removes all tags for privacy. Overrides any fields below.</p>
                </div>
                <div class="w-10 h-6 rounded-full transition-colors" [class]="state.stripAll ? 'bg-rose-500' : 'bg-gray-700'">
                  <div class="w-4 h-4 rounded-full bg-white mt-1 transition-transform" [class]="state.stripAll ? 'translate-x-5' : 'translate-x-1'"></div>
                </div>
              </div>

              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 grid grid-cols-1 md:grid-cols-2 gap-4" [class.opacity-40]="state.stripAll" [class.pointer-events-none]="state.stripAll">
                @for (field of tagFields; track field.key) {
                  <div class="flex flex-col gap-1.5">
                    <label class="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{{ field.label }}</label>
                    <input
                      type="text"
                      [placeholder]="field.placeholder"
                      [value]="state.tags[field.key]"
                      (input)="onTagChange(field.key, $event)"
                      class="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                    >
                  </div>
                }
              </div>
            </div>

            <!-- Right Panel -->
            <div class="w-full lg:w-80 flex flex-col gap-6">
              <div class="bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col min-h-[300px]">
                @if (state.status === 'processing') {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6" [@fadeIn]>
                    <div class="relative w-24 h-24 mb-4">
                      <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle stroke-width="4" stroke="#1f2937" fill="transparent" r="46" cx="50" cy="50" />
                        <circle class="text-indigo-500 transition-all" stroke-width="4" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50"
                                stroke-dasharray="290" [style.stroke-dashoffset]="290 - (290 * state.progress) / 100" stroke-linecap="round" />
                      </svg>
                      <div class="absolute inset-0 flex items-center justify-center text-lg font-black">{{ state.progress }}%</div>
                    </div>
                  </div>
                }

                @if (state.status === 'done' && state.outputBlob) {
                  <div class="flex-1 flex flex-col items-center justify-center mb-6 gap-3 text-center" [@slideUp]>
                    <div class="text-3xl">✅</div>
                    <p class="font-black text-lg">Tags Written!</p>
                    <p class="text-xs text-gray-500">File size unchanged (copy codec)</p>
                  </div>
                }

                @if (state.status === 'error') {
                  <div class="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">{{ state.errorMessage }}</div>
                }

                <div class="mt-auto">
                  @if (state.status === 'done' && state.outputBlob) {
                    <button (click)="onDownload(state)" class="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all">⬇ Download Tagged File</button>
                  } @else {
                    <button (click)="onProcess(state)" [disabled]="state.status === 'processing'"
                        class="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        [class]="state.status === 'processing' ? 'bg-gray-800 text-indigo-400' : 'bg-gradient-to-r from-indigo-500 to-violet-500 hover:opacity-90 active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.2)]'">
                      @if (state.status === 'processing') {
                        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                        Writing Tags...
                      } @else { 🏷️ Write Tags }
                    </button>
                  }
                </div>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`:host { display: block; height: 100%; }`]
})
export class MetadataComponent implements OnDestroy {
  private store = inject(Store);
  readonly state$ = this.store.select(selectMetadataState);
  private cachedBlobUrls = new Map<Blob, string>();

  readonly tagFields: { key: keyof AudioTags; label: string; placeholder: string }[] = [
    { key: 'title', label: 'Title', placeholder: 'Track title...' },
    { key: 'artist', label: 'Artist', placeholder: 'Artist name...' },
    { key: 'album', label: 'Album', placeholder: 'Album name...' },
    { key: 'albumArtist', label: 'Album Artist', placeholder: 'Album artist...' },
    { key: 'year', label: 'Year', placeholder: '2024' },
    { key: 'genre', label: 'Genre', placeholder: 'Rock, Pop, Jazz...' },
    { key: 'track', label: 'Track #', placeholder: '01' },
    { key: 'disc', label: 'Disc #', placeholder: '1' },
    { key: 'composer', label: 'Composer', placeholder: 'Composer name...' },
    { key: 'comment', label: 'Comment', placeholder: 'Notes...' },
    { key: 'copyright', label: 'Copyright', placeholder: '© 2024 ...' },
  ];

  onFileSelected(files: File[]) { if (files.length) this.store.dispatch(MetadataActions.loadFile({ file: files[0] })); }
  onTagChange(key: keyof AudioTags, e: Event) { this.store.dispatch(MetadataActions.updateTag({ key, value: (e.target as any).value })); }
  onToggleStrip() { this.store.dispatch(MetadataActions.toggleStripAll()); }

  onProcess(state: any) { if (state.status === 'processing') return; this.store.dispatch(MetadataActions.startProcessing()); }

  getBlobUrl(blob: Blob): string {
    if (this.cachedBlobUrls.has(blob)) return this.cachedBlobUrls.get(blob)!;
    const url = URL.createObjectURL(blob); this.cachedBlobUrls.set(blob, url); return url;
  }

  onDownload(state: any) {
    if (!state.outputBlob) return;
    const a = document.createElement('a');
    a.href = this.getBlobUrl(state.outputBlob);
    a.download = `omni_tagged_${state.inputFile?.name}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  onReset() { this.cachedBlobUrls.forEach(url => URL.revokeObjectURL(url)); this.cachedBlobUrls.clear(); this.store.dispatch(MetadataActions.resetState()); }
  ngOnDestroy() { this.onReset(); }
}
