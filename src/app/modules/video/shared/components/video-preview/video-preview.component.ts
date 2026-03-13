import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-video-preview',
  standalone: true,
  template: `
    <div class="rounded-xl overflow-hidden bg-black shadow-lg border border-gray-700">
      @if (videoUrl) {
        <video 
          controls 
          class="w-full h-auto max-h-[60vh] object-contain"
          [src]="videoUrl">
        </video>
      } @else {
        <div class="h-64 flex items-center justify-center text-gray-500">
          No video selected
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoPreviewComponent {
  @Input() videoUrl: string | null = null;
}
