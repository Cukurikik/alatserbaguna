import { ChangeDetectionStrategy, Component } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { LucideAngularModule, Settings, Shield, HardDrive, Cpu, Palette } from 'lucide-angular';

@Component({
  selector: 'app-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div class="flex flex-col gap-8 pb-12 max-w-4xl mx-auto" @fadeSlideIn>
      <div>
        <h1 class="text-3xl font-sans font-bold text-white tracking-tight mb-2">Settings</h1>
        <p class="text-text-secondary">Configure Omni-Tool engine preferences and system behavior.</p>
      </div>

      <div class="flex flex-col gap-6">
        <!-- Appearance -->
        <section class="bg-bg-elevated border border-white/5 rounded-3xl p-8">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-12 h-12 rounded-xl bg-accent-cyan/10 flex items-center justify-center">
              <lucide-icon [img]="PaletteIcon" class="w-6 h-6 text-accent-cyan"></lucide-icon>
            </div>
            <h2 class="text-xl font-bold text-white">Appearance</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5">
              <div>
                <h4 class="font-bold text-white">Theme</h4>
                <p class="text-xs text-text-muted">Dark mode is default</p>
              </div>
              <select class="bg-bg-surface border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-accent-cyan">
                <option>Dark</option>
                <option>System</option>
              </select>
            </div>
            <div class="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5">
              <div>
                <h4 class="font-bold text-white">Animations</h4>
                <p class="text-xs text-text-muted">Enable UI transitions</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" value="" class="sr-only peer" checked>
                <div class="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-cyan"></div>
              </label>
            </div>
          </div>
        </section>

        <!-- Engine Settings -->
        <section class="bg-bg-elevated border border-white/5 rounded-3xl p-8">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-12 h-12 rounded-xl bg-accent-purple/10 flex items-center justify-center">
              <lucide-icon [img]="CpuIcon" class="w-6 h-6 text-accent-purple"></lucide-icon>
            </div>
            <h2 class="text-xl font-bold text-white">Engine & Performance</h2>
          </div>
          <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5">
              <div>
                <h4 class="font-bold text-white">WebGPU Acceleration</h4>
                <p class="text-xs text-text-muted">Use GPU for AI models and rendering</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" value="" class="sr-only peer" checked>
                <div class="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-purple"></div>
              </label>
            </div>
            <div class="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5">
              <div>
                <h4 class="font-bold text-white">Max Worker Threads</h4>
                <p class="text-xs text-text-muted">Limit concurrent WASM workers</p>
              </div>
              <select class="bg-bg-surface border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-accent-purple">
                <option>Auto (Recommended)</option>
                <option>2 Threads</option>
                <option>4 Threads</option>
                <option>8 Threads</option>
              </select>
            </div>
          </div>
        </section>

        <!-- Storage -->
        <section class="bg-bg-elevated border border-white/5 rounded-3xl p-8">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-12 h-12 rounded-xl bg-status-info/10 flex items-center justify-center">
              <lucide-icon [img]="HardDriveIcon" class="w-6 h-6 text-status-info"></lucide-icon>
            </div>
            <h2 class="text-xl font-bold text-white">Storage (OPFS)</h2>
          </div>
          <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5">
              <div>
                <h4 class="font-bold text-white">Clear Cache</h4>
                <p class="text-xs text-text-muted">Free up 4.2 GB of temporary files</p>
              </div>
              <button class="px-4 py-2 rounded-lg bg-status-error/20 text-status-error font-medium hover:bg-status-error/30 transition-colors">
                Clear Now
              </button>
            </div>
          </div>
        </section>
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
export class SettingsComponent {
  PaletteIcon = Palette;
  CpuIcon = Cpu;
  HardDriveIcon = HardDrive;
  ShieldIcon = Shield;
  SettingsIcon = Settings;
}
