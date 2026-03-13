import { ChangeDetectionStrategy, Component, signal, HostListener } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  template: `
    <header 
      class="w-full px-8 py-5 flex items-center justify-between transition-all duration-500 z-50 border-b relative overflow-hidden"
      [ngClass]="isScrolled() ? 'bg-zinc-950/80 backdrop-blur-2xl border-white/10 shadow-2xl py-4' : 'bg-transparent border-transparent'"
    >
      <!-- Top Glow -->
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>

      <!-- Left: Identity -->
      <div class="flex items-center gap-6">
        <button class="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all active:scale-90">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"/></svg>
        </button>
        
        <div class="flex items-center gap-4 group cursor-pointer">
          <div class="relative">
            <div class="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] group-hover:scale-110 transition-all duration-500 rotate-3 group-hover:rotate-0">
              <svg class="w-6 h-6 text-white stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-zinc-950"></div>
          </div>
          <div class="flex flex-col">
            <h1 class="text-xl font-black tracking-tighter text-white leading-none">
              OMNI<span class="text-emerald-500 text-2xl">.</span>TOOL
            </h1>
            <span class="text-[8px] font-black text-emerald-500/60 uppercase tracking-[0.3em] font-mono leading-none mt-1.5">Enterprise_Suite_v19</span>
          </div>
        </div>
      </div>

      <!-- Right: System & Ops -->
      <div class="flex items-center gap-6">
        <!-- Status -->
        <div class="hidden md:flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all duration-500 group group-hover:bg-white/10">
           <div class="relative flex h-2 w-2">
             <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
             <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
           </div>
           <span class="text-[9px] font-black text-gray-500 group-hover:text-emerald-400 transition-colors uppercase tracking-[0.2em] font-mono italic">Node_Active</span>
        </div>

        <div class="h-8 w-px bg-white/10 mx-2"></div>

        <!-- User -->
        <button class="flex items-center gap-4 group">
          <div class="flex flex-col items-end">
            <span class="text-[10px] font-black text-white uppercase tracking-tight">Kapten_User</span>
            <span class="text-[8px] font-mono text-emerald-500/60 uppercase tracking-widest leading-none">Root_Admin</span>
          </div>
          <div class="relative">
             <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-zinc-800 border border-white/10 flex items-center justify-center group-hover:border-emerald-500/50 transition-all">
                <span class="text-emerald-400 font-black text-lg">K</span>
             </div>
             <div class="absolute -top-1 -right-1 w-4 h-4 rounded-lg bg-indigo-500 border-2 border-zinc-950 flex items-center justify-center">
                <svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/></svg>
             </div>
          </div>
        </button>
      </div>
    </header>
  `,
  styles: ``,
})
export class Navbar {
  isScrolled = signal(false);

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled.set(window.scrollY > 20);
  }
}
