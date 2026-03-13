import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-watermark',
  standalone: true,
  imports: [],
  template: `
    <div class='p-6 text-white min-h-screen bg-gray-900 border border-gray-800 rounded-xl backdrop-blur-md bg-opacity-80'>
      <h2 class='text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent'>Watermark Tool</h2>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WatermarkComponent {
}