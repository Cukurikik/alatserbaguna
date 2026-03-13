import { ChangeDetectionStrategy, Component, signal, HostListener } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  template: `
    <header 
      class="w-full px-6 py-4 flex items-center justify-between transition-all duration-300 z-50 rounded-b-2xl md:rounded-b-none border-b border-white/5"
      [ngClass]="{'glass-panel backdrop-blur-md bg-zinc-950/40 shadow-xl border-white/10': isScrolled()}"
    >
      <!-- Left side: Mobile menu toggle / Brand -->
      <div class="flex items-center gap-4">
        <button class="md:hidden p-2 rounded-xl text-zinc-400 hover:text-emerald-400 hover:bg-white/5 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        </button>
        
        <div class="hidden md:flex items-center gap-3">
          <div class="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-emerald-400 stroke-current"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <h1 class="text-xl font-bold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 text-transparent bg-clip-text">
            Omni<span class="text-emerald-500 font-extrabold">-</span>Tool
          </h1>
        </div>
      </div>

      <!-- Right side: Status and Profile -->
      <div class="flex items-center gap-5">
        <!-- Status Indicator -->
        <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors">
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          </span>
          <span class="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">System Online</span>
        </div>

        <!-- AI Assistant Button -->
        <button class="relative p-2 rounded-xl text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-300 hover:scale-105 active:scale-95 group">
          <div class="absolute -top-1 -right-1 h-3 w-3 bg-indigo-500 rounded-full border-2 border-zinc-950"></div>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
        </button>

        <!-- Divider -->
        <div class="h-6 w-[1px] bg-white/10"></div>

        <!-- User Profile (Kapten) -->
        <button class="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div class="relative">
            <div class="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-600 to-zinc-800 p-[2px]">
              <div class="h-full w-full rounded-full bg-zinc-950 flex items-center justify-center">
                <span class="text-sm font-bold text-emerald-400">K</span>
              </div>
            </div>
            <div class="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-zinc-950 rounded-full"></div>
          </div>
          <span class="hidden md:block text-sm font-medium text-zinc-200">Kapten</span>
        </button>
      </div>
    </header>
  `,
  styles: ``,
})
export class Navbar {
  isScrolled = signal(false);

  // We should listen to the main scroll container, but for simplified global shell
  // we listen to window scroll. In the shell implementation, the <main> element scrolls.
  // We'll update the shell later to emit scroll events if needed.
}
