import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { z } from 'zod';
import { trigger, transition, style, animate } from '@angular/animations';
import { LucideAngularModule, Scissors, Play, Download, AlertCircle, CheckCircle2 } from 'lucide-angular';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';

// Zod Schema (validasi runtime)
export const VideoTaskSchema = z.object({
  id: z.string().uuid(),
  inputFile: z.instanceof(File),
  operation: z.enum(['trim', 'merge', 'convert', 'stabilize']),
  options: z.object({
    startTime: z.number().min(0),
    endTime: z.number().min(0.1)
  }),
  status: z.enum(['idle', 'processing', 'success', 'error']),
  progress: z.number().min(0).max(100),
  createdAt: z.date(),
});

export type VideoTask = z.infer<typeof VideoTaskSchema>;

@Component({
  selector: 'app-video-trimmer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="flex flex-col gap-8 pb-12 max-w-3xl mx-auto" @fadeSlideIn>
      <div>
        <h1 class="text-3xl font-sans font-bold text-white tracking-tight mb-2 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-accent-cyan/10 flex items-center justify-center">
            <lucide-icon [img]="ScissorsIcon" class="w-5 h-5 text-accent-cyan"></lucide-icon>
          </div>
          Video Trimmer
        </h1>
        <p class="text-text-secondary">Trim video files locally with frame-perfect precision using WASM FFmpeg.</p>
      </div>

      <div class="bg-bg-elevated border border-white/5 rounded-3xl p-6 md:p-8">
        <form [formGroup]="trimForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-6">
          
          <!-- File Input -->
          <div class="flex flex-col gap-2">
            <label for="fileInput" class="text-sm font-bold text-white">Input Video</label>
            <div class="relative border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-accent-cyan/50 hover:bg-white/5 transition-all cursor-pointer"
                 [class.border-accent-cyan]="selectedFile()">
              <input id="fileInput" type="file" accept="video/*" (change)="onFileSelected($event)" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
              @if (selectedFile()) {
                <div class="flex flex-col items-center gap-2">
                  <lucide-icon [img]="PlayIcon" class="w-8 h-8 text-accent-cyan"></lucide-icon>
                  <span class="text-white font-medium">{{ selectedFile()?.name }}</span>
                  <span class="text-xs text-text-muted">{{ (selectedFile()?.size || 0) / 1024 / 1024 | number:'1.1-2' }} MB</span>
                </div>
              } @else {
                <div class="flex flex-col items-center gap-2">
                  <lucide-icon [img]="DownloadIcon" class="w-8 h-8 text-text-muted"></lucide-icon>
                  <span class="text-text-secondary font-medium">Drag & drop or click to select</span>
                  <span class="text-xs text-text-muted">MP4, WEBM, MKV up to 2GB</span>
                </div>
              }
            </div>
            @if (trimForm.get('file')?.invalid && trimForm.get('file')?.touched) {
              <span class="text-xs text-status-error flex items-center gap-1 mt-1">
                <lucide-icon [img]="AlertCircleIcon" class="w-3 h-3"></lucide-icon> Video file is required
              </span>
            }
          </div>

          <!-- Time Controls -->
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <label for="startTime" class="text-sm font-bold text-white">Start Time (s)</label>
              <input id="startTime" type="number" formControlName="startTime" step="0.1" min="0"
                     class="bg-bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-all">
            </div>
            <div class="flex flex-col gap-2">
              <label for="endTime" class="text-sm font-bold text-white">End Time (s)</label>
              <input id="endTime" type="number" formControlName="endTime" step="0.1" min="0.1"
                     class="bg-bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-all">
            </div>
          </div>
          @if (trimForm.hasError('invalidRange')) {
            <span class="text-xs text-status-error flex items-center gap-1">
              <lucide-icon [img]="AlertCircleIcon" class="w-3 h-3"></lucide-icon> End time must be greater than start time
            </span>
          }

          <!-- Action Button -->
          <button type="submit" 
                  [disabled]="trimForm.invalid || taskState().status === 'processing'"
                  class="mt-4 w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                  [ngClass]="{
                    'bg-accent-cyan text-bg-surface hover:bg-accent-cyan/90 shadow-glow': trimForm.valid && taskState().status !== 'processing',
                    'bg-white/5 text-text-muted cursor-not-allowed': trimForm.invalid || taskState().status === 'processing'
                  }">
            
            @if (taskState().status === 'processing') {
              <div class="w-5 h-5 border-2 border-text-muted border-t-transparent rounded-full animate-spin"></div>
              Processing... {{ taskState().progress }}%
            } @else if (taskState().status === 'success') {
              <lucide-icon [img]="CheckCircle2Icon" class="w-5 h-5"></lucide-icon>
              Trim Complete
            } @else {
              <lucide-icon [img]="ScissorsIcon" class="w-5 h-5"></lucide-icon>
              Trim Video
            }
          </button>
          
          @if (taskState().status === 'error') {
            <div class="p-4 rounded-xl bg-status-error/10 border border-status-error/20 text-status-error text-sm flex items-start gap-3">
              <lucide-icon [img]="AlertCircleIcon" class="w-5 h-5 shrink-0"></lucide-icon>
              <p>Failed to process video. Please check the file format and try again.</p>
            </div>
          }
        </form>
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
export class VideoTrimmerComponent {
  private fb = inject(FormBuilder);
  private store = inject(Store);

  ScissorsIcon = Scissors;
  PlayIcon = Play;
  DownloadIcon = Download;
  AlertCircleIcon = AlertCircle;
  CheckCircle2Icon = CheckCircle2;

  selectedFile = signal<File | null>(null);
  taskState = signal<{status: 'idle' | 'processing' | 'success' | 'error', progress: number}>({
    status: 'idle',
    progress: 0
  });

  trimForm = this.fb.group({
    file: [null as File | null, Validators.required],
    startTime: [0, [Validators.required, Validators.min(0)]],
    endTime: [10, [Validators.required, Validators.min(0.1)]]
  }, { validators: this.timeRangeValidator });

  timeRangeValidator(group: AbstractControl) {
    const start = group.get('startTime')?.value;
    const end = group.get('endTime')?.value;
    return start !== null && end !== null && start >= end ? { invalidRange: true } : null;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile.set(file);
      this.trimForm.patchValue({ file });
      this.trimForm.get('file')?.markAsTouched();
    }
  }

  onSubmit() {
    if (this.trimForm.invalid || !this.selectedFile()) return;

    const formValue = this.trimForm.value;
    
    try {
      // Validasi dengan Zod
      VideoTaskSchema.parse({
        id: crypto.randomUUID(),
        inputFile: this.selectedFile(),
        operation: 'trim',
        options: {
          startTime: formValue.startTime,
          endTime: formValue.endTime
        },
        status: 'processing',
        progress: 0,
        createdAt: new Date()
      });

      // Simulasi proses
      this.taskState.set({ status: 'processing', progress: 0 });
      
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        this.taskState.set({ status: 'processing', progress });
        
        if (progress >= 100) {
          clearInterval(interval);
          this.taskState.set({ status: 'success', progress: 100 });
          
          // Reset form after 3 seconds
          setTimeout(() => {
            if (this.taskState().status === 'success') {
              this.taskState.set({ status: 'idle', progress: 0 });
            }
          }, 3000);
        }
      }, 300);

    } catch (error) {
      console.error('Validation Error:', error);
      this.taskState.set({ status: 'error', progress: 0 });
    }
  }
}
