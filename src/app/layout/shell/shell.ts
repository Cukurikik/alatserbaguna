import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Navbar, Sidebar],
  template: `
    <div class="min-h-screen bg-zinc-950 text-zinc-50 flex overflow-hidden">
      <!-- Fixed Sidebar -->
      <app-sidebar class="shrink-0 transition-all duration-300 z-40 hidden md:block" />
      
      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <!-- Floating Navbar -->
        <app-navbar class="sticky top-0 z-30 flex-shrink-0" />
        
        <!-- Page View (Scrollable) -->
        <main class="flex-1 overflow-x-hidden overflow-y-auto w-full relative z-10 p-4 md:p-6 lg:p-8">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: ``,
})
export class Shell {}
