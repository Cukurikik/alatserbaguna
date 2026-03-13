import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { WorkerBridgeService } from '../shared/engine/worker-bridge.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';

interface VideoMeta { title: string; artist: string; comment: string; year: string; }
interface MetadataState { status: 'idle'|'processing'|'success'|'error'; progress: number; inputFile: File|null; outputBlob: Blob|null; meta: VideoMeta; detectedInfo: string; }
const initialState: MetadataState = { status: 'idle', progress: 0, inputFile: null, outputBlob: null, meta: { title: '', artist: '', comment: '', year: '' }, detectedInfo: '' };

const MetadataActions = createActionGroup({ source: 'MetadataEditor', events: {
  'Load File': props<{ file: File; info: string }>(),
  'Set Meta': props<{ meta: VideoMeta }>(),
  'Start Processing': emptyProps(),
  'Update Progress': props<{ progress: number }>(),
  'Processing Success': props<{ outputBlob: Blob }>(),
  'Processing Failure': props<{ message: string }>(),
  'Reset State': emptyProps(),
}});

const metadataFeature = createFeature({ name: 'metadataEditor', reducer: createReducer(initialState,
  on(MetadataActions.loadFile, (s, { file, info }) => ({ ...s, inputFile: file, detectedInfo: info, meta: { ...s.meta, title: file.name.replace(/\.[^.]+$/, '') } })),
  on(MetadataActions.setMeta, (s, { meta }) => ({ ...s, meta })),
  on(MetadataActions.startProcessing, (s) => ({ ...s, status: 'processing', progress: 0 })),
  on(MetadataActions.updateProgress, (s, { progress }) => ({ ...s, progress })),
  on(MetadataActions.processingSuccess, (s, { outputBlob }) => ({ ...s, status: 'success', outputBlob, progress: 100 })),
  on(MetadataActions.processingFailure, (s) => ({ ...s, status: 'error' })),
  on(MetadataActions.resetState, () => initialState),
)});

@Component({
  selector: 'app-metadata-editor',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, FileDropZoneComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-rose-300 to-orange-400 bg-clip-text text-transparent pb-1">Metadata Editor</h2>
        <p class="text-gray-400 text-sm mt-1">Embed or edit title, artist, comment and year tags using FFmpeg -metadata flags.</p>
      </div>

      @if (vm$ | async; as vm) {
        @if (!vm.inputFile) {
          <div class="flex-1 flex flex-col justify-center">
            <app-file-drop-zone accept="video/*" (fileDropped)="onFile($event)"></app-file-drop-zone>
          </div>
        } @else {
          <div class="flex flex-col lg:flex-row gap-6">
            <!-- File Info Card -->
            <div class="flex-1 flex flex-col gap-4">
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-5">
                <div class="flex items-center gap-4 mb-4">
                  <div class="w-14 h-14 rounded-xl bg-rose-900/40 flex items-center justify-center flex-shrink-0">
                    <svg class="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                  </div>
                  <div>
                    <p class="text-white font-medium">{{ vm.inputFile.name }}</p>
                    <p class="text-gray-400 text-sm">{{ (vm.inputFile.size / 1024 / 1024 | number: '1.2-2') }} MB · {{ vm.inputFile.type }}</p>
                  </div>
                </div>
              </div>
              <!-- FFmpeg preview -->
              <div class="bg-gray-950 border border-gray-700 rounded-xl p-4 font-mono text-xs text-rose-300 break-all">
                ffmpeg -i input.mp4<br>
                @if (vm.meta.title) { -metadata title="{{ vm.meta.title }}"<br> }
                @if (vm.meta.artist) { -metadata artist="{{ vm.meta.artist }}"<br> }
                @if (vm.meta.comment) { -metadata comment="{{ vm.meta.comment }}"<br> }
                @if (vm.meta.year) { -metadata year="{{ vm.meta.year }}"<br> }
                -c copy output.mp4
              </div>
            </div>

            <!-- Edit Fields -->
            <div class="w-full lg:w-80 flex flex-col gap-3">
              @for (field of metaFields; track field.key) {
                <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
                  <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{{ field.label }}</label>
                  <input [type]="field.type" [placeholder]="field.placeholder" [value]="getMetaVal(field.key, vm.meta)"
                    (input)="updateMeta(field.key, $event, vm.meta)"
                    class="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-400 focus:outline-none text-sm">
                </div>
              }

              @if (vm.status === 'processing') {
                <div class="bg-gray-800 rounded-xl p-6 flex flex-col items-center"><app-progress-ring [progress]="vm.progress" [status]="'Writing metadata...'"></app-progress-ring></div>
              } @else if (vm.status === 'success') {
                <button (click)="onDownload(vm)" class="w-full bg-rose-600 hover:bg-rose-500 text-white py-3 rounded-xl font-bold">Download Tagged Video</button>
                <button (click)="onReset()" class="text-sm text-center text-gray-400 hover:text-white">Try Another</button>
              } @else {
                <button (click)="onProcess(vm)" class="w-full bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all active:scale-95">
                  🏷 Write Metadata
                </button>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetadataEditorComponent {
  private store = inject(Store);
  private workerBridge = inject(WorkerBridgeService);
  readonly vm$ = this.store.select(metadataFeature.selectMetadataEditorState);

  readonly metaFields = [
    { key: 'title', label: 'Title', type: 'text', placeholder: 'Video title...' },
    { key: 'artist', label: 'Artist / Author', type: 'text', placeholder: 'Creator name...' },
    { key: 'year', label: 'Year', type: 'number', placeholder: new Date().getFullYear().toString() },
    { key: 'comment', label: 'Comment', type: 'text', placeholder: 'Additional notes...' },
  ];

  getMetaVal(key: string, meta: VideoMeta): string { return (meta as any)[key] as string; }

  updateMeta(key: string, e: Event, currentMeta: VideoMeta): void {
    const updated: VideoMeta = { ...currentMeta, [key]: (e.target as HTMLInputElement).value };
    this.store.dispatch(MetadataActions.setMeta({ meta: updated }));
  }

  onFile(file: File): void {
    const info = `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`;
    this.store.dispatch(MetadataActions.loadFile({ file, info }));
  }

  onProcess(state: MetadataState): void {
    this.store.dispatch(MetadataActions.startProcessing());
    if (state.inputFile) {
      const worker = new Worker(new URL('./metadata-editor.worker', import.meta.url), { type: 'module' });
      this.workerBridge.runTask(worker, { file: state.inputFile, meta: state.meta }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') this.store.dispatch(MetadataActions.updateProgress({ progress: msg.value }));
          else if (msg.type === 'complete') this.store.dispatch(MetadataActions.processingSuccess({ outputBlob: new Blob([msg.data as BlobPart], { type: 'video/mp4' }) }));
        },
        error: (err) => this.store.dispatch(MetadataActions.processingFailure({ message: err.message }))
      });
    }
  }

  onDownload(state: MetadataState): void {
    if (state.outputBlob) { const url = URL.createObjectURL(state.outputBlob); const a = Object.assign(document.createElement('a'), { href: url, download: 'omni_tagged.mp4' }); document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 150); }
  }

  onReset(): void { this.store.dispatch(MetadataActions.resetState()); }
}