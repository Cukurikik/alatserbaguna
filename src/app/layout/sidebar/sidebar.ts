import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, NgClass],
  template: `
    <aside 
      class="h-full bg-zinc-950/40 backdrop-blur-xl border-r border-white/5 flex flex-col transition-all duration-300 relative z-40"
      [ngClass]="expanded() ? 'w-64' : 'w-20'"
      (mouseenter)="expanded.set(true)"
      (mouseleave)="expanded.set(false)"
    >
      <!-- Top Space (Lines up with Navbar) -->
      <div class="h-20 flex-shrink-0"></div>

      <!-- Navigation Content -->
      <nav class="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-2 relative custom-scrollbar">
        <!-- Main Dashboard Link -->
        <a 
          routerLink="/dashboard" 
          routerLinkActive="bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500 shadow-[inset_2px_0_10px_rgba(16,185,129,0.1)]"
          [routerLinkActiveOptions]="{exact: true}"
          class="flex items-center gap-4 px-3 py-3 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-zinc-100 transition-all duration-200 group relative overflow-hidden"
        >
          <div class="h-6 w-6 flex-shrink-0 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover:scale-110 transition-transform"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
          </div>
          <span class="font-medium whitespace-nowrap transition-opacity duration-300" 
                [ngClass]="expanded() ? 'opacity-100' : 'opacity-0 hidden'">Omni-Dashboard</span>
        </a>

        <!-- Divider -->
        <div class="my-4 border-t border-white/5 mx-2"></div>

        <!-- Section Title -->
        <div 
          class="px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap transition-opacity duration-300"
          [ngClass]="expanded() ? 'opacity-100' : 'opacity-0'"
        >
          {{ expanded() ? 'Media Capabilities' : '...' }}
        </div>

        <!-- Video Tools Link -->
        <a 
          routerLink="/video" 
          routerLinkActive="bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500 shadow-[inset_2px_0_10px_rgba(16,185,129,0.1)]"
          class="flex items-center gap-4 px-3 py-3 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-zinc-100 transition-all duration-200 group relative overflow-hidden"
        >
          <div class="h-6 w-6 flex-shrink-0 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover:scale-110 transition-transform"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
          </div>
          <span class="font-medium whitespace-nowrap transition-opacity duration-300" 
                [ngClass]="expanded() ? 'opacity-100' : 'opacity-0 hidden'">Video Engine</span>
        </a>

        <!-- AI Studio GenAI Link -->
         <a 
          routerLink="/ai-assistant" 
          routerLinkActive="bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500 shadow-[inset_2px_0_10px_rgba(99,102,241,0.1)]"
          class="flex items-center gap-4 px-3 py-3 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-zinc-100 transition-all duration-200 group relative overflow-hidden mt-2"
        >
          <div class="h-6 w-6 flex-shrink-0 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover:scale-110 transition-transform"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
          </div>
          <span class="font-medium whitespace-nowrap transition-opacity duration-300" 
                [ngClass]="expanded() ? 'opacity-100' : 'opacity-0 hidden'">AI Assistant</span>
        </a>
      </nav>

      <!-- Bottom System Version -->
      <div 
        class="h-16 flex items-center px-4 border-t border-white/5 flex-shrink-0 whitespace-nowrap transition-opacity duration-300"
        [ngClass]="expanded() ? 'opacity-100 bg-white/5' : 'opacity-0'"
      >
        <div class="flex flex-col relative top-1">
          <span class="text-xs font-semibold text-zinc-300">Omni-Tool System</span>
          <span class="text-[10px] text-zinc-500">v19.0.0-rc</span>
        </div>
      </div>
    </aside>
  `,
  styles: `
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
    }
  `,
})
export class Sidebar {
  expanded = signal(false);
}
