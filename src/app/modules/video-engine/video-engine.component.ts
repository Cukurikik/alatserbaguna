import { ChangeDetectionStrategy, Component } from '@angular/core';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ToolCardComponent, Tool } from '../../shared/components/tool-card/tool-card.component';
import { LucideAngularModule, Search, Filter } from 'lucide-angular';

export const VIDEO_TOOLS: Tool[] = [
  // Category: Basic
  { id: 'trim',           label: 'Video Trimmer',    icon: '✂️',  category: 'basic',    status: 'stable' },
  { id: 'merge',          label: 'Video Merger',     icon: '🔗',  category: 'basic',    status: 'stable' },
  { id: 'convert',        label: 'Format Converter', icon: '🔄',  category: 'basic',    status: 'stable' },
  { id: 'compress',       label: 'Compressor',       icon: '📦',  category: 'basic',    status: 'stable' },
  { id: 'crop',           label: 'Smart Crop',       icon: '📐',  category: 'basic',    status: 'stable' },
  // Category: Advanced
  { id: 'rotate-flip',    label: 'Rotate & Flip',    icon: '🔃',  category: 'advanced', status: 'stable' },
  { id: 'speed-control',  label: 'Speed Control',    icon: '⚡',  category: 'advanced', status: 'stable' },
  { id: 'reverse',        label: 'Reverse',          icon: '⏪',  category: 'advanced', status: 'stable' },
  { id: 'loop',           label: 'Loop Engine',      icon: '🔁',  category: 'advanced', status: 'stable' },
  { id: 'stabilizer',     label: 'Stabilizer',       icon: '🎯',  category: 'advanced', status: 'stable' },
  { id: 'subtitle-burner', label: 'Subtitle Burner', icon: '💬',  category: 'advanced', status: 'stable' },
  { id: 'thumbnail-gen',  label: 'Thumbnail Gen',    icon: '🖼️',  category: 'advanced', status: 'stable' },
  { id: 'gif-maker',      label: 'GIF Maker',        icon: '🎞️',  category: 'advanced', status: 'stable' },
  { id: 'watermark',      label: 'Watermark Adder',  icon: '💧',  category: 'advanced', status: 'stable' },
  { id: 'gif-converter',  label: 'GIF Converter',    icon: '🎞️',  category: 'advanced', status: 'stable' },
  { id: 'frame-extractor', label: 'Frame Extractor', icon: '🎞️',  category: 'advanced', status: 'stable' },
  // Category: Pro
  { id: 'audio-extractor', label: 'Audio Extractor', icon: '🎵',  category: 'pro',      status: 'stable' },
  { id: 'audio-replacer',  label: 'Audio Replacer',  icon: '🔊',  category: 'pro',      status: 'stable' },
  { id: 'color-grading',   label: 'Color Grading',   icon: '🎨',  category: 'pro',      status: 'beta' },
  { id: 'denoiser',        label: 'AI Denoiser',     icon: '✨',  category: 'pro',      status: 'experimental' },
  { id: 'upscaler-ai',     label: 'AI Upscaler',     icon: '🚀',  category: 'pro',      status: 'experimental' },
  { id: 'background-blur', label: 'Background Blur', icon: '🌫️',  category: 'pro',      status: 'beta' },
  { id: 'object-remover',  label: 'Object Remover',  icon: '🗑️',  category: 'pro',      status: 'experimental' },
  { id: 'scene-detector',  label: 'Scene Detector',  icon: '🎬',  category: 'pro',      status: 'stable' },
  { id: 'voice-remover',   label: 'Voice Remover',   icon: '🎤',  category: 'pro',      status: 'experimental' },
  { id: 'metadata-editor', label: 'Metadata Editor', icon: '📋',  category: 'pro',      status: 'stable' },
  // Category: Recording & Creation
  { id: 'screen-recorder', label: 'Screen Recorder', icon: '🖥️',  category: 'pro',      status: 'stable' },
  { id: 'webcam-recorder', label: 'Webcam Recorder', icon: '📷',  category: 'pro',      status: 'stable' },
  { id: 'slideshow-maker', label: 'Slideshow Maker', icon: '🎞️',  category: 'pro',      status: 'stable' },
  { id: 'video-to-mp3',    label: 'Video to MP3',    icon: '🎵',  category: 'pro',      status: 'stable' },
  { id: 'pip-overlay',     label: 'PiP Overlay',     icon: '🖼️',  category: 'pro',      status: 'stable' },
  { id: 'batch-processor', label: 'Batch Processor', icon: '📦',  category: 'pro',      status: 'stable' },
  { id: 'comparison',      label: 'Comparison',      icon: '⚖️',  category: 'pro',      status: 'stable' },
  { id: 'auto-subtitle',   label: 'Auto Subtitle',   icon: '💬',  category: 'pro',      status: 'stable' },
  { id: 'silence-remover', label: 'Silence Remover', icon: '✂️',  category: 'pro',      status: 'stable' }
];

@Component({
  selector: 'app-video-engine',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ToolCardComponent, LucideAngularModule],
  template: `
    <div class="flex flex-col gap-8 pb-12" @fadeSlideIn>
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 class="text-3xl md:text-4xl font-sans font-bold text-white tracking-tight mb-2">Video Engine</h1>
          <p class="text-text-secondary text-lg">30+ tools for processing, editing, and enhancing video files locally.</p>
        </div>
        
        <div class="flex items-center gap-3 w-full md:w-auto">
          <div class="relative flex-1 md:w-72 group">
            <lucide-icon [img]="SearchIcon" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent-cyan transition-colors"></lucide-icon>
            <input type="text" placeholder="Search tools..." 
                   class="w-full bg-white/5 border border-white/5 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/30 focus:ring-1 focus:ring-accent-cyan/20 transition-all">
          </div>
          <button class="bg-white/5 border border-white/5 rounded-2xl p-2.5 hover:bg-white/10 hover:border-accent-cyan/30 transition-all hover:scale-105 active:scale-95">
            <lucide-icon [img]="FilterIcon" class="w-5 h-5 text-text-secondary"></lucide-icon>
          </button>
        </div>
      </div>

      <div class="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        <button class="px-5 py-2 rounded-xl bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 text-sm font-bold whitespace-nowrap hover:bg-accent-cyan/20 transition-all">All Tools</button>
        <button class="px-5 py-2 rounded-xl bg-white/5 border border-white/5 text-text-secondary hover:text-white hover:bg-white/10 text-sm font-medium whitespace-nowrap transition-all">Basic</button>
        <button class="px-5 py-2 rounded-xl bg-white/5 border border-white/5 text-text-secondary hover:text-white hover:bg-white/10 text-sm font-medium whitespace-nowrap transition-all">Advanced</button>
        <button class="px-5 py-2 rounded-xl bg-white/5 border border-white/5 text-text-secondary hover:text-white hover:bg-white/10 text-sm font-medium whitespace-nowrap transition-all">Pro</button>
        <button class="px-5 py-2 rounded-xl bg-white/5 border border-white/5 text-text-secondary hover:text-white hover:bg-white/10 text-sm font-medium whitespace-nowrap transition-all">AI Powered</button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6" @staggerCards>
        @for (tool of tools; track tool.id) {
          <app-tool-card [tool]="tool" />
        }
      </div>
    </div>
  `,
  animations: [
    trigger('fadeSlideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(24px)' }),
        animate('400ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerCards', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'scale(0.92)' }),
          stagger(40, animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' })))\
        ], { optional: true })
      ])
    ])
  ]
})
export class VideoEngineComponent {
  tools = VIDEO_TOOLS;
  
  SearchIcon = Search;
  FilterIcon = Filter;
}
