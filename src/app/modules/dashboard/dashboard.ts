import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { NgClass } from '@angular/common';

interface Tool {
  id: string;
  name: string;
  category: 'Video' | 'AI' | 'Utility';
  route: string;
  description: string;
  colorGrid: string;
  iconBg: string;
  badgeStyle: string;
  textGradient: string;
  bottomLine: string;
}

const TOOLS_DATA: Tool[] = [
  { id: '01', name: 'Trimmer', category: 'Video', route: 'trimmer', description: 'Precision temporal cutting' },
  { id: '02', name: 'Merger', category: 'Video', route: 'merger', description: 'Matrix stream concatenation' },
  { id: '03', name: 'Converter', category: 'Utility', route: 'converter', description: 'Format transcoding engine' },
  { id: '04', name: 'Compressor', category: 'Utility', route: 'compressor', description: 'Bitrate threshold reduction' },
  { id: '05', name: 'Stabilizer', category: 'AI', route: 'stabilizer', description: 'Motion-vector smoothing' },
  { id: '06', name: 'Reverser', category: 'Utility', route: 'reverser', description: 'Temporal frame inversion' },
  { id: '07', name: 'Speed', category: 'Video', route: 'speed', description: 'Velocity manipulation' },
  { id: '08', name: 'Looper', category: 'Utility', route: 'looper', description: 'Cyclic frame duplication' },
  { id: '09', name: 'Flip / Rotate', category: 'Video', route: 'flip-rotate', description: 'Spatial orientation shifts' },
  { id: '10', name: 'Crop / Resize', category: 'Video', route: 'crop-resize', description: 'Aspect ratio & scaling' },
  { id: '11', name: 'Color Grading', category: 'Video', route: 'color-grading', description: 'LUT & aesthetic shifts' },
  { id: '12', name: 'Subtitles', category: 'Utility', route: 'subtitles', description: 'SRT hardcoding engine' },
  { id: '13', name: 'Thumbnail', category: 'Utility', route: 'thumbnail', description: 'Frame extraction & sprite mapping' },
  { id: '14', name: 'Watermark', category: 'Video', route: 'watermark', description: 'Overlay asset burning' },
  { id: '15', name: 'Extract Audio', category: 'Utility', route: 'extract-audio', description: 'Audio stream isolation' },
  { id: '16', name: 'Replace Audio', category: 'Video', route: 'replace-audio', description: 'Audio track injection' },
  { id: '17', name: 'Denoiser', category: 'AI', route: 'denoiser', description: 'Neural artifact removal' },
  { id: '18', name: 'Interpolator', category: 'AI', route: 'interpolate', description: 'Frame-rate upscaling' },
  { id: '19', name: 'Metadata', category: 'Utility', route: 'metadata', description: 'ID3/MP4 header injection' },
  { id: '20', name: 'Splitter', category: 'Utility', route: 'splitter', description: 'Chunk segregation' },
  { id: '21', name: 'Screen Record', category: 'Utility', route: 'screen-recorder', description: 'Temporal stream capture' },
  { id: '22', name: 'Video to GIF', category: 'Utility', route: 'to-gif', description: 'Palette synthesis matrix' },
  { id: '23', name: 'PiP', category: 'Video', route: 'pip', description: 'Picture-in-picture overlay' },
  { id: '24', name: 'Blur', category: 'Video', route: 'blur', description: 'Spatial Gaussian blurring' },
  { id: '25', name: 'Transitions', category: 'Video', route: 'transitions', description: 'Crossfade matrix' },
  { id: '26', name: 'Compare', category: 'Utility', route: 'compare', description: 'Diff verification layer' },
  { id: '27', name: 'Slideshow', category: 'Video', route: 'slideshow', description: 'Image duration array' },
  { id: '28', name: 'Batch Process', category: 'Utility', route: 'batch', description: 'Parallel processing core' },
  { id: '29', name: 'Analyser', category: 'Utility', route: 'analyser', description: 'FFprobe neural scan' },
  { id: '30', name: 'Upscaler', category: 'AI', route: 'upscaler', description: 'WebGPU Super Resolution' }
].map(t => {
  // Map styles dynamically based on category
  let styles = {};
  if (t.category === 'AI') {
    styles = {
      colorGrid: 'from-indigo-500 to-purple-500',
      iconBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
      badgeStyle: 'border-indigo-500/20 text-indigo-500 bg-indigo-500/5',
      textGradient: 'from-indigo-400 to-purple-400',
      bottomLine: 'bg-gradient-to-r from-indigo-500 to-purple-500'
    };
  } else if (t.category === 'Video') {
    styles = {
      colorGrid: 'from-emerald-500 to-teal-500',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      badgeStyle: 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5',
      textGradient: 'from-emerald-400 to-teal-400',
      bottomLine: 'bg-gradient-to-r from-emerald-500 to-teal-500'
    };
  } else {
    styles = {
      colorGrid: 'from-rose-500 to-orange-500',
      iconBg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
      badgeStyle: 'border-rose-500/20 text-rose-500 bg-rose-500/5',
      textGradient: 'from-rose-400 to-orange-400',
      bottomLine: 'bg-gradient-to-r from-rose-500 to-orange-500'
    };
  }
  return { ...t, ...styles } as Tool;
});

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('staggerFade', [
      transition(':enter', [
        query('.tool-card', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger('30ms', [
            animate('500ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 lg:p-10 flex flex-col overflow-y-auto custom-scrollbar relative z-10" [@staggerFade]="activeCategory()">
      
      <!-- Premium Header -->
      <div class="mb-10 lg:mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-20">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-4">
             <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse outline outline-2 outline-indigo-500/30"></span>
             <span class="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Omni_Core_Online</span>
          </div>
          <h1 class="text-4xl lg:text-5xl font-black bg-gradient-to-br from-white via-white/90 to-white/40 bg-clip-text text-transparent drop-shadow-lg tracking-tight pb-2">
            Command Center
          </h1>
          <p class="text-gray-400 text-sm mt-2 font-medium max-w-lg leading-relaxed mix-blend-plus-lighter">
            Access 30+ high-performance neural engines and temporal editing matrixes. All processing operates locally via WebAssembly and WebGPU bounds.
          </p>
        </div>
        
        <!-- Category Filter -->
        <div class="flex gap-2 p-1.5 bg-black/40 border border-white/5 rounded-2xl backdrop-blur-md">
           @for (cat of ['All', 'Video', 'AI', 'Utility']; track cat) {
              <button 
                (click)="activeCategory.set(cat)"
                [ngClass]="activeCategory() === cat ? 'bg-white/10 text-white shadow-lg shadow-white/5' : 'text-gray-500 hover:text-white hover:bg-white/[0.02]'"
                class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300">
                {{ cat }}
              </button>
           }
        </div>
      </div>

      <!-- Tools Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 relative z-10">
         @for (tool of filteredTools(); track tool.id) {
           <a [routerLink]="['/video', tool.route]" 
              class="tool-card group relative p-6 bg-gradient-to-br from-gray-900/40 to-black/40 backdrop-blur-md border border-gray-800/80 hover:border-white/20 rounded-[2rem] flex flex-col gap-4 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black">
              
              <!-- Glow Effect -->
              <div class="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
                   [ngClass]="tool.colorGrid"></div>
              
              <div class="flex items-start justify-between">
                 <div class="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner transition-all duration-500 group-hover:scale-110"
                      [ngClass]="tool.iconBg">
                    <svg class="w-6 h-6 currentColor" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                 </div>
                 
                 <span class="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md border"
                       [ngClass]="tool.badgeStyle">
                    {{ tool.category }}
                 </span>
              </div>
              
              <div class="mt-2">
                 <h3 class="text-white font-bold text-sm uppercase tracking-wide group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r transition-colors"
                     [ngClass]="tool.textGradient">
                    {{ tool.name }}
                 </h3>
                 <p class="text-xs text-gray-500 mt-1.5 leading-relaxed truncate">{{ tool.description }}</p>
              </div>
              
              <!-- Bottom accent line -->
              <div class="absolute bottom-0 inset-x-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                   [ngClass]="tool.bottomLine"></div>
           </a>
         }
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4b5563; }
  `]
})
export class Dashboard {
  activeCategory = signal('All');
  tools = TOOLS_DATA;

  filteredTools = computed(() => {
    const cat = this.activeCategory();
    if (cat === 'All') return this.tools;
    return this.tools.filter(t => t.category === cat);
  });
}
