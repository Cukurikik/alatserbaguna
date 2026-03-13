import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExportConfig } from '../../types/video.types';
import { LucideAngularModule, Download, FileVideo } from 'lucide-angular';

@Component({
  selector: 'app-export-panel',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-lg">
      <div class="flex items-center gap-3 mb-6">
        <div class="p-2 bg-cyan-500/10 rounded-lg">
          <lucide-icon [img]="FileVideo" class="w-6 h-6 text-cyan-400"></lucide-icon>
        </div>
        <h3 class="text-lg font-semibold text-white">Export Settings</h3>
      </div>

      <div class="space-y-6">
        <!-- Format Selector -->
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-2" for="formatSelector">Format</label>
          <div class="flex flex-wrap gap-2" id="formatSelector">
            @for (format of availableFormats; track format) {
              <button
                (click)="selectFormat(format)"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                [class.bg-cyan-500]="selectedFormat() === format"
                [class.text-white]="selectedFormat() === format"
                [class.bg-gray-800]="selectedFormat() !== format"
                [class.text-gray-400]="selectedFormat() !== format"
                [class.hover:bg-gray-700]="selectedFormat() !== format"
              >
                {{ format.toUpperCase() }}
              </button>
            }
          </div>
        </div>

        <!-- Filename Input -->
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-2" for="filenameInput">Filename</label>
          <div class="flex items-center bg-gray-800 rounded-lg border border-gray-700 focus-within:border-cyan-500 transition-colors">
            <input
              id="filenameInput"
              type="text"
              [value]="customFilename()"
              (input)="onFilenameChange($event)"
              class="w-full bg-transparent text-white px-4 py-2 outline-none"
              placeholder="Enter filename"
            />
            <span class="px-4 text-gray-500 border-l border-gray-700">.{{ selectedFormat() }}</span>
          </div>
        </div>

        <!-- Output Size Display -->
        @if (sizeMB !== null) {
          <div class="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <span class="text-sm text-gray-400">Estimated Size</span>
            <span class="text-sm font-mono text-cyan-400">{{ sizeMB.toFixed(2) }} MB</span>
          </div>
        }

        <!-- Download Button -->
        <button
          (click)="onDownload()"
          [disabled]="!blob"
          class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all duration-300"
          [class.bg-cyan-500]="blob"
          [class.hover:bg-cyan-400]="blob"
          [class.text-white]="blob"
          [class.shadow-[0_0_20px_rgba(0,245,255,0.3)]]="blob"
          [class.bg-gray-800]="!blob"
          [class.text-gray-500]="!blob"
          [class.cursor-not-allowed]="!blob"
        >
          <lucide-icon [img]="Download" class="w-5 h-5"></lucide-icon>
          {{ blob ? 'Download File' : 'Waiting for processing...' }}
        </button>
      </div>
    </div>
  `
})
export class ExportPanelComponent implements OnInit {
  @Input() blob: Blob | null = null;
  @Input() sizeMB: number | null = null;
  @Input() outputBlob: Blob | null = null;
  @Input() outputSizeMB: number | null = null;
  @Input() availableFormats: string[] = ['mp4', 'webm', 'mov'];
  @Input() filename = 'omni_output';

  @Output() download = new EventEmitter<ExportConfig>();
  @Output() formatChanged = new EventEmitter<string>();

  selectedFormat = signal('mp4');
  customFilename = signal(this.filename);

  readonly Download = Download;
  readonly FileVideo = FileVideo;

  ngOnInit() {
    this.customFilename.set(this.filename);
    if (this.availableFormats.length > 0 && !this.availableFormats.includes(this.selectedFormat())) {
      this.selectedFormat.set(this.availableFormats[0]);
    }
  }

  selectFormat(format: string) {
    this.selectedFormat.set(format);
    this.formatChanged.emit(format);
  }

  onFilenameChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.customFilename.set(input.value || this.filename);
  }

  onDownload() {
    if (!this.blob) return;

    const config: ExportConfig = {
      format: this.selectedFormat() as ExportConfig['format'],
      codec: 'default',
      quality: 'balanced',
      filename: `${this.customFilename()}.${this.selectedFormat()}`
    };

    this.download.emit(config);
  }
}
