import { ChangeDetectionStrategy, Component } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { LucideAngularModule, UploadCloud, FileType2, ArrowRight } from 'lucide-angular';

@Component({
  selector: 'app-converter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div class="flex flex-col gap-8 pb-12 max-w-4xl mx-auto" @fadeSlideIn>
      <div class="text-center">
        <h1 class="text-3xl font-sans font-bold text-white tracking-tight mb-2">Universal Converter</h1>
        <p class="text-text-secondary">Convert any file format instantly using WASM. 100% local, no uploads.</p>
      </div>

      <div class="bg-bg-elevated border border-white/5 rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center gap-6 border-dashed hover:border-accent-cyan/50 hover:bg-white/5 transition-all cursor-pointer group">
        <div class="w-20 h-20 rounded-full bg-accent-cyan/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
          <lucide-icon [img]="UploadCloudIcon" class="w-10 h-10 text-accent-cyan"></lucide-icon>
        </div>
        <div class="text-center">
          <h3 class="text-xl font-bold text-white mb-2">Drag & Drop Files Here</h3>
          <p class="text-text-secondary">or click to browse from your device</p>
        </div>
        <button class="mt-4 px-6 py-3 rounded-xl bg-accent-cyan text-bg-surface font-bold hover:bg-accent-cyan/90 transition-colors shadow-glow">
          Select Files
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-bg-elevated border border-white/5 rounded-2xl p-6 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-accent-purple/10 flex items-center justify-center">
            <lucide-icon [img]="FileType2Icon" class="w-6 h-6 text-accent-purple"></lucide-icon>
          </div>
          <div>
            <h4 class="font-bold text-white">Video</h4>
            <p class="text-xs text-text-muted">MP4, WEBM, MKV, AVI</p>
          </div>
        </div>
        <div class="bg-bg-elevated border border-white/5 rounded-2xl p-6 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-accent-pink/10 flex items-center justify-center">
            <lucide-icon [img]="FileType2Icon" class="w-6 h-6 text-accent-pink"></lucide-icon>
          </div>
          <div>
            <h4 class="font-bold text-white">Audio</h4>
            <p class="text-xs text-text-muted">MP3, WAV, OGG, FLAC</p>
          </div>
        </div>
        <div class="bg-bg-elevated border border-white/5 rounded-2xl p-6 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-accent-cyan/10 flex items-center justify-center">
            <lucide-icon [img]="FileType2Icon" class="w-6 h-6 text-accent-cyan"></lucide-icon>
          </div>
          <div>
            <h4 class="font-bold text-white">Image</h4>
            <p class="text-xs text-text-muted">JPG, PNG, WEBP, AVIF</p>
          </div>
        </div>
      </div>
    </div>
  `,
  animations: [
    trigger('fadeSlideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(24px)' }),
        animate('400ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class ConverterComponent {
  UploadCloudIcon = UploadCloud;
  FileType2Icon = FileType2;
  ArrowRightIcon = ArrowRight;
}
