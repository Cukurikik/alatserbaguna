import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-export-panel',
  standalone: true,
  template: `
    <div class="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl mt-6">
      <h3 class="text-lg font-semibold text-white mb-4">Export Options</h3>
      
      <div class="flex flex-col sm:flex-row gap-4">
        <!-- Format Selector -->
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-400 mb-2">Output Format</label>
          <select 
            class="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-400 focus:outline-none transition-colors"
            (change)="onFormatChange($event)">
            @for (fmt of formats; track fmt) {
              <option [value]="fmt" [selected]="fmt === selectedFormat">{{ fmt.toUpperCase() }}</option>
            }
          </select>
        </div>

        <!-- Export Action -->
        <div class="flex-1 flex items-end">
          <button 
            [disabled]="disabled"
            (click)="exportClicked.emit(selectedFormat)"
            class="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-2 px-4 rounded-lg shadow-[0_0_15px_rgba(0,195,255,0.4)] disabled:opacity-50 disabled:shadow-none transition-all duration-300 transform active:scale-95">
            Start Processing
          </button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExportPanelComponent {
  @Input() formats = ['mp4', 'webm', 'mov'];
  @Input() selectedFormat = 'mp4';
  @Input() disabled = false;
  
  @Output() formatChange = new EventEmitter<string>();
  @Output() exportClicked = new EventEmitter<string>();

  onFormatChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectedFormat = select.value;
    this.formatChange.emit(this.selectedFormat);
  }
}
