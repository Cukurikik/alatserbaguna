import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MergerStore } from './merger.store';
import { MergerConfig } from './merger.schema';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { ExportPanelComponent } from '../shared/components/export-panel/export-panel.component';
import { LucideAngularModule, Layers, RefreshCw, Settings2, Link } from 'lucide-angular';

@Component({
  selector: 'app-merger',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FileDropZoneComponent,
    ProgressRingComponent,
    ExportPanelComponent,
    LucideAngularModule
  ],
  template: `
    <div class="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div class="max-w-6xl mx-auto space-y-8">
        <!-- Header -->
        <div class="flex items-center space-x-4">
          <div class="p-3 bg-fuchsia-500/20 rounded-xl">
            <lucide-icon name="layers" class="w-8 h-8 text-fuchsia-400"></lucide-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold tracking-tight text-white">Merge Videos</h1>
            <p class="text-neutral-400 mt-1">Combine multiple video files into a single video.</p>
          </div>
        </div>

        <!-- Main Content -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Left Column: Input & Preview -->
          <div class="lg:col-span-2 space-y-6">
            @if (store.inputFiles().length === 0) {
              <app-file-drop-zone
                accept="video/*"
                [multiple]="true"
                title="Drop multiple videos here"
                subtitle="Select 2 to 10 videos (MP4, WebM, MOV)"
                (filesSelected)="onFilesSelected($event)">
              </app-file-drop-zone>
            } @else {
              <div class="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
                <div class="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50">
                  <h3 class="font-medium flex items-center space-x-2">
                    <lucide-icon name="layers" class="w-4 h-4 text-fuchsia-400"></lucide-icon>
                    <span>Selected Videos ({{ store.inputFiles().length }})</span>
                  </h3>
                  <button (click)="store.resetState()" class="text-xs text-neutral-400 hover:text-white transition-colors flex items-center space-x-1 bg-neutral-800 px-2 py-1 rounded-md">
                    <lucide-icon name="refresh-cw" class="w-3 h-3"></lucide-icon>
                    <span>Start Over</span>
                  </button>
                </div>
                
                <div class="p-4 space-y-3">
                  @if (store.status() === 'loading') {
                    <div class="flex flex-col items-center space-y-4 py-12">
                      <div class="w-8 h-8 border-4 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin"></div>
                      <p class="text-sm text-neutral-400">Analyzing videos...</p>
                    </div>
                  } @else {
                    @for (file of store.inputFiles(); track file.name; let i = $index) {
                      <div class="flex items-center justify-between p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
                        <div class="flex items-center space-x-3 overflow-hidden">
                          <div class="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center text-xs font-bold text-neutral-400 shrink-0">
                            {{ i + 1 }}
                          </div>
                          <div class="truncate">
                            <p class="text-sm font-medium text-white truncate">{{ file.name }}</p>
                            <p class="text-xs text-neutral-500">
                              {{ (file.size / (1024 * 1024)) | number:'1.1-2' }} MB
                              @if (store.videoMetas()[i]) {
                                • {{ store.videoMetas()[i].duration | number:'1.1-1' }}s
                                • {{ store.videoMetas()[i].width }}x{{ store.videoMetas()[i].height }}
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    }
                  }
                </div>
              </div>
            }
          </div>

          <!-- Right Column: Controls -->
          <div class="space-y-6">
            <div class="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
              <h3 class="text-lg font-medium mb-6 flex items-center space-x-2">
                <lucide-icon name="settings-2" class="w-5 h-5 text-fuchsia-400"></lucide-icon>
                <span>Merge Settings</span>
              </h3>
              
              <div class="space-y-6" [class.opacity-50]="store.inputFiles().length < 2 || store.status() === 'processing'" [class.pointer-events-none]="store.inputFiles().length < 2 || store.status() === 'processing'">
                
                <!-- Resolution -->
                <div class="space-y-3">
                  <label class="text-sm font-medium text-neutral-300">Output Resolution</label>
                  <select 
                    [ngModel]="store.resolution()" 
                    (ngModelChange)="updateConfig('resolution', $event)"
                    class="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500 transition-colors appearance-none">
                    <option value="original">Original (Fastest, requires same dimensions)</option>
                    <option value="1080p">Force 1080p (Re-encodes)</option>
                    <option value="720p">Force 720p (Re-encodes)</option>
                  </select>
                  <p class="text-[10px] text-neutral-500">
                    If videos have different dimensions, you must select 1080p or 720p.
                  </p>
                </div>

                <!-- Transition -->
                <div class="space-y-3 pt-4 border-t border-neutral-800">
                  <label class="text-sm font-medium text-neutral-300">Transition</label>
                  <select 
                    [ngModel]="store.transition()" 
                    (ngModelChange)="updateConfig('transition', $event)"
                    class="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500 transition-colors appearance-none">
                    <option value="none">None (Cut)</option>
                  </select>
                  <p class="text-[10px] text-neutral-500">
                    Fade transition coming soon.
                  </p>
                </div>

                <!-- Process Button -->
                <button 
                  (click)="processVideo()"
                  [disabled]="store.inputFiles().length < 2 || store.status() === 'processing'"
                  class="w-full py-3 px-4 bg-fuchsia-600 hover:bg-fuchsia-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-xl font-medium transition-all flex items-center justify-center space-x-2">
                  @if (store.status() === 'processing') {
                    <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Merging...</span>
                  } @else {
                    <lucide-icon name="link" class="w-5 h-5"></lucide-icon>
                    <span>Merge Videos</span>
                  }
                </button>
              </div>
            </div>

            <!-- Progress & Export -->
            @if (store.status() === 'processing' || store.status() === 'done' || store.status() === 'error') {
              <div class="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
                @if (store.status() === 'processing') {
                  <div class="flex flex-col items-center justify-center py-6 space-y-4">
                    <app-progress-ring [progress]="store.progress()"></app-progress-ring>
                    <p class="text-sm text-neutral-400 font-medium">Merging videos...</p>
                  </div>
                }
                
                @if (store.status() === 'error') {
                  <div class="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center space-y-2">
                    <p class="text-red-400 font-medium">{{ store.errorMessage() }}</p>
                    @if (store.retryable()) {
                      <button (click)="processVideo()" class="text-sm text-red-300 hover:text-red-200 underline">Try Again</button>
                    }
                  </div>
                }

                @if (store.status() === 'done' && store.outputBlob()) {
                  <app-export-panel
                    [blob]="store.outputBlob()!"
                    [filename]="'omni_merged.mp4'"
                    [sizeMB]="store.outputSizeMB()!">
                  </app-export-panel>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class MergerComponent {
  store = inject(MergerStore);

  onFilesSelected(files: File[]) {
    this.store.loadFiles({ files });
  }

  updateConfig(key: keyof MergerConfig, value: string) {
    this.store.updateConfig({ [key]: value });
  }

  processVideo() {
    this.store.startProcessing();
  }
}
