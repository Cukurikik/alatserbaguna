import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe, UpperCasePipe, DatePipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectSystem, selectTasks } from '../../store/app.selectors';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { LucideAngularModule, Activity, HardDrive, Cpu, Zap, CheckCircle2, Clock, AlertCircle, ChevronRight } from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, UpperCasePipe, DatePipe, LucideAngularModule],
  template: `
    <div class="flex flex-col gap-8 pb-12" @fadeSlideIn>
      
      <!-- Hero Section -->
      <section class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-bg-elevated to-bg-surface border border-white/5 p-8 md:p-12 shadow-card">
        <div class="absolute top-0 right-0 w-96 h-96 bg-accent-purple/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 w-64 h-64 bg-accent-cyan/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        
        <div class="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 class="text-4xl md:text-5xl font-sans font-bold text-white tracking-tight mb-2">
              Welcome back, <span class="text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-accent-purple">Commander</span>
            </h1>
            <p class="text-text-secondary text-lg">Omni-Tool Engine is online and ready for processing.</p>
          </div>
          
          <div class="flex items-center gap-4 bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div class="flex flex-col items-center px-4 border-r border-white/10">
              <lucide-icon [img]="CpuIcon" class="w-6 h-6 text-accent-cyan mb-1"></lucide-icon>
              <span class="text-xs font-mono text-text-muted">CPU</span>
              <span class="text-sm font-bold text-white">12%</span>
            </div>
            <div class="flex flex-col items-center px-4">
              <lucide-icon [img]="HardDriveIcon" class="w-6 h-6 text-accent-purple mb-1"></lucide-icon>
              <span class="text-xs font-mono text-text-muted">MEM</span>
              <span class="text-sm font-bold text-white">{{ (system$ | async)?.memoryUsage || 0 }}MB</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats Row -->
      <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" @staggerCards>
        <div class="bg-bg-elevated/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-accent-cyan/30 transition-colors group">
          <div class="flex justify-between items-start mb-4">
            <div class="w-10 h-10 rounded-xl bg-accent-cyan/10 flex items-center justify-center group-hover:bg-accent-cyan/20 transition-colors">
              <lucide-icon [img]="ZapIcon" class="w-5 h-5 text-accent-cyan"></lucide-icon>
            </div>
            <span class="text-xs font-mono text-status-success bg-status-success/10 px-2 py-1 rounded-full">+12%</span>
          </div>
          <h3 class="text-text-secondary text-sm font-medium mb-1">Total Tools</h3>
          <p class="text-3xl font-bold text-white font-mono">74</p>
        </div>

        <div class="bg-bg-elevated/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-accent-purple/30 transition-colors group">
          <div class="flex justify-between items-start mb-4">
            <div class="w-10 h-10 rounded-xl bg-accent-purple/10 flex items-center justify-center group-hover:bg-accent-purple/20 transition-colors">
              <lucide-icon [img]="CheckCircle2Icon" class="w-5 h-5 text-accent-purple"></lucide-icon>
            </div>
          </div>
          <h3 class="text-text-secondary text-sm font-medium mb-1">Tasks Completed</h3>
          <p class="text-3xl font-bold text-white font-mono">{{ (tasks$ | async)?.totalCompleted || 0 }}</p>
        </div>

        <div class="bg-bg-elevated/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-accent-pink/30 transition-colors group">
          <div class="flex justify-between items-start mb-4">
            <div class="w-10 h-10 rounded-xl bg-accent-pink/10 flex items-center justify-center group-hover:bg-accent-pink/20 transition-colors">
              <lucide-icon [img]="ActivityIcon" class="w-5 h-5 text-accent-pink"></lucide-icon>
            </div>
          </div>
          <h3 class="text-text-secondary text-sm font-medium mb-1">Files Processed</h3>
          <p class="text-3xl font-bold text-white font-mono">1,204</p>
        </div>

        <div class="bg-bg-elevated/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-status-info/30 transition-colors group">
          <div class="flex justify-between items-start mb-4">
            <div class="w-10 h-10 rounded-xl bg-status-info/10 flex items-center justify-center group-hover:bg-status-info/20 transition-colors">
              <lucide-icon [img]="HardDriveIcon" class="w-5 h-5 text-status-info"></lucide-icon>
            </div>
            <span class="text-xs font-mono text-status-warning bg-status-warning/10 px-2 py-1 rounded-full">85%</span>
          </div>
          <h3 class="text-text-secondary text-sm font-medium mb-1">OPFS Storage</h3>
          <p class="text-3xl font-bold text-white font-mono">4.2 <span class="text-lg text-text-muted">GB</span></p>
        </div>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Quick Access -->
        <section class="lg:col-span-2 flex flex-col gap-6">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-white tracking-tight">Quick Access</h2>
            <button class="text-sm font-medium text-accent-cyan hover:text-white transition-colors flex items-center gap-1 group">
              View All Tools
              <lucide-icon [img]="ChevronRightIcon" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></lucide-icon>
            </button>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" @staggerCards>
            @for (tool of quickTools; track tool.id) {
              <div class="bg-bg-elevated/40 backdrop-blur-sm border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 hover:bg-white/5 hover:border-accent-cyan/30 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-glow group">
                <div class="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
                  {{ tool.icon }}
                </div>
                <span class="text-sm font-medium text-text-primary text-center group-hover:text-white transition-colors">{{ tool.label }}</span>
              </div>
            }
          </div>

          <!-- Recent Activity -->
          <div class="flex flex-col gap-4 mt-4">
            <h2 class="text-xl font-bold text-white tracking-tight">Recent Activity</h2>
            <div class="bg-bg-elevated/40 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden">
              @if ((tasks$ | async)?.history?.length === 0) {
                <div class="p-12 flex flex-col items-center justify-center text-center gap-3">
                  <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
                    <lucide-icon [img]="ClockIcon" class="w-8 h-8 text-text-muted"></lucide-icon>
                  </div>
                  <p class="text-white font-medium">No recent activity</p>
                  <p class="text-sm text-text-muted max-w-xs">Start by using one of the tools from the sidebar or quick access.</p>
                </div>
              } @else {
                <div class="divide-y divide-white/5">
                  @for (task of (tasks$ | async)?.history; track task.id) {
                    <div class="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                      <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-xl">
                          {{ getToolIcon(task.toolId) }}
                        </div>
                        <div>
                          <p class="text-sm font-medium text-white">{{ task.inputFiles[0]?.name || 'Unknown File' }}</p>
                          <p class="text-xs text-text-muted">{{ task.toolId | uppercase }} • {{ task.createdAt | date:'shortTime' }}</p>
                        </div>
                      </div>
                      <div class="flex items-center gap-4">
                        <div class="flex flex-col items-end">
                          <span class="text-xs font-mono font-bold uppercase" 
                                [class.text-status-success]="task.status === 'success'"
                                [class.text-accent-cyan]="task.status === 'processing'"
                                [class.text-status-error]="task.status === 'error'">
                            {{ task.status }}
                          </span>
                          @if (task.status === 'processing') {
                            <div class="w-24 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                              <div class="h-full bg-accent-cyan transition-all duration-300" [style.width.%]="task.progress"></div>
                            </div>
                          }
                        </div>
                        <button class="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-text-muted hover:text-white transition-colors">
                          <lucide-icon [img]="ChevronRightIcon" class="w-4 h-4"></lucide-icon>
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </section>

        <!-- System Status -->
        <section class="flex flex-col gap-6">
          <h2 class="text-xl font-bold text-white tracking-tight">System Status</h2>
          <div class="bg-bg-elevated/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6 flex flex-col gap-6">
            
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center border border-white/5">
                  <lucide-icon [img]="CpuIcon" class="w-5 h-5 text-text-secondary"></lucide-icon>
                </div>
                <div>
                  <p class="text-sm font-medium text-white">FFmpeg Engine</p>
                  <p class="text-[10px] text-text-muted font-mono uppercase tracking-wider">WASM v0.12.6</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full" [class.bg-status-success]="(system$ | async)?.ffmpegLoaded" [class.bg-status-warning]="!(system$ | async)?.ffmpegLoaded"></div>
                <span class="text-[10px] font-mono font-bold uppercase tracking-widest" [class.text-status-success]="(system$ | async)?.ffmpegLoaded" [class.text-status-warning]="!(system$ | async)?.ffmpegLoaded">
                  {{ (system$ | async)?.ffmpegLoaded ? 'Ready' : 'Loading' }}
                </span>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center border border-white/5">
                  <lucide-icon [img]="ZapIcon" class="w-5 h-5 text-text-secondary"></lucide-icon>
                </div>
                <div>
                  <p class="text-sm font-medium text-white">AI Vision</p>
                  <p class="text-[10px] text-text-muted font-mono uppercase tracking-wider">ONNX WebGPU</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full" [class.bg-status-success]="(system$ | async)?.onnxLoaded" [class.bg-status-warning]="!(system$ | async)?.onnxLoaded"></div>
                <span class="text-[10px] font-mono font-bold uppercase tracking-widest" [class.text-status-success]="(system$ | async)?.onnxLoaded" [class.text-status-warning]="!(system$ | async)?.onnxLoaded">
                  {{ (system$ | async)?.onnxLoaded ? 'Ready' : 'Standby' }}
                </span>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center border border-white/5">
                  <lucide-icon [img]="HardDriveIcon" class="w-5 h-5 text-text-secondary"></lucide-icon>
                </div>
                <div>
                  <p class="text-sm font-medium text-white">Local Storage</p>
                  <p class="text-[10px] text-text-muted font-mono uppercase tracking-wider">OPFS Active</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full" [class.bg-status-success]="(system$ | async)?.opfsAvailable" [class.bg-status-error]="!(system$ | async)?.opfsAvailable"></div>
                <span class="text-[10px] font-mono font-bold uppercase tracking-widest" [class.text-status-success]="(system$ | async)?.opfsAvailable" [class.text-status-error]="!(system$ | async)?.opfsAvailable">
                  {{ (system$ | async)?.opfsAvailable ? 'Active' : 'Error' }}
                </span>
              </div>
            </div>

            <!-- Resource Monitor -->
            <div class="mt-4 p-4 rounded-xl bg-black/20 border border-white/5">
              <div class="flex justify-between items-center mb-3">
                <span class="text-xs font-medium text-text-secondary">Memory Usage</span>
                <span class="text-xs font-mono text-white">{{ (system$ | async)?.memoryUsage || 0 }}MB</span>
              </div>
              <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-accent-cyan to-accent-purple transition-all duration-500" 
                     [style.width.%]="((system$ | async)?.memoryUsage || 0) / 2048 * 100"></div>
              </div>
              <p class="text-[10px] text-text-muted mt-2">Max recommended: 2048MB</p>
            </div>

          </div>

          <!-- Quick Actions -->
          <div class="bg-gradient-to-br from-accent-purple/20 to-accent-cyan/20 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">Quick Actions</h3>
            <div class="grid grid-cols-2 gap-3">
              <button class="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-white transition-all">
                Clear Cache
              </button>
              <button class="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-white transition-all">
                Export Logs
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
    ]),
    trigger('staggerCards', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'scale(0.92)' }),
          stagger(60, animate('350ms ease-out', style({ opacity: 1, transform: 'scale(1)' })))
        ], { optional: true })
      ])
    ])
  ]
})
export class DashboardComponent {
  private store = inject(Store);

  system$ = this.store.select(selectSystem);
  tasks$ = this.store.select(selectTasks);

  CpuIcon = Cpu;
  HardDriveIcon = HardDrive;
  ZapIcon = Zap;
  CheckCircle2Icon = CheckCircle2;
  ActivityIcon = Activity;
  ClockIcon = Clock;
  AlertCircleIcon = AlertCircle;
  ChevronRightIcon = ChevronRight;

  quickTools = [
    { id: 'trim', label: 'Video Trimmer', icon: '✂️' },
    { id: 'merge', label: 'Video Merger', icon: '🔗' },
    { id: 'convert', label: 'Format Converter', icon: '🔄' },
    { id: 'compress', label: 'Compressor', icon: '📦' },
    { id: 'upscale', label: 'AI Upscaler', icon: '🚀' },
    { id: 'denoise', label: 'AI Denoiser', icon: '✨' },
    { id: 'stabilize', label: 'Stabilizer', icon: '🎯' },
    { id: 'color', label: 'Color Grading', icon: '🎨' },
  ];

  getToolIcon(toolId: string): string {
    const tool = this.quickTools.find(t => t.id === toolId);
    return tool ? tool.icon : '🛠️';
  }
}
