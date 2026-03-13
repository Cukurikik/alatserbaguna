import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, signal, OnChanges, SimpleChanges, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoMeta } from '../../types/video.types';
import { LucideAngularModule, Play, Pause, Volume2, VolumeX } from 'lucide-angular';

@Component({
  selector: 'app-video-preview',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-full bg-black rounded-lg overflow-hidden group">
      @if (isLoading()) {
        <div class="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10">
          <div class="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
      
      <video
        #videoPlayer
        class="w-full h-auto max-h-[60vh] object-contain"
        [src]="objectUrl()"
        [autoplay]="autoPlay"
        (loadedmetadata)="onLoadedMetadata($event)"
        (timeupdate)="onTimeUpdate($event)"
        (play)="isPlaying.set(true)"
        (pause)="isPlaying.set(false)"
        (ended)="isPlaying.set(false)"
      ></video>

      @if (showControls && objectUrl()) {
        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div class="flex items-center gap-4">
            <button (click)="togglePlay()" class="text-white hover:text-cyan-400 transition-colors">
              <lucide-icon [img]="isPlaying() ? Pause : Play" class="w-6 h-6"></lucide-icon>
            </button>
            
            <span class="text-xs text-gray-300 font-mono">
              {{ formatTime(currentTimeSignal()) }} / {{ formatTime(duration()) }}
            </span>
            
            <input
              type="range"
              class="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              [min]="0"
              [max]="duration() || 100"
              [value]="currentTimeSignal()"
              (input)="onSeek($event)"
            />
            
            <button (click)="toggleMute()" class="text-white hover:text-cyan-400 transition-colors">
              <lucide-icon [img]="isMuted() ? VolumeX : Volume2" class="w-5 h-5"></lucide-icon>
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class VideoPreviewComponent implements OnChanges, OnDestroy {
  @Input() file: File | null = null;
  @Input() currentTime = 0;
  @Input() showControls = true;
  @Input() autoPlay = false;

  @Output() durationDetected = new EventEmitter<number>();
  @Output() videoSeeked = new EventEmitter<number>();
  @Output() metadataLoaded = new EventEmitter<VideoMeta>();

  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;

  objectUrl = signal<string | null>(null);
  duration = signal(0);
  isLoading = signal(true);
  isPlaying = signal(false);
  isMuted = signal(false);
  currentTimeSignal = signal(0);

  readonly Play = Play;
  readonly Pause = Pause;
  readonly Volume2 = Volume2;
  readonly VolumeX = VolumeX;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['file']) {
      this.isLoading.set(true);
      if (this.objectUrl()) {
        URL.revokeObjectURL(this.objectUrl()!);
      }
      
      if (this.file) {
        this.objectUrl.set(URL.createObjectURL(this.file));
      } else {
        this.objectUrl.set(null);
        this.isLoading.set(false);
      }
    }

    if (changes['currentTime'] && this.videoPlayer?.nativeElement) {
      if (Math.abs(this.videoPlayer.nativeElement.currentTime - this.currentTime) > 0.5) {
        this.videoPlayer.nativeElement.currentTime = this.currentTime;
      }
    }
  }

  ngOnDestroy() {
    if (this.objectUrl()) {
      URL.revokeObjectURL(this.objectUrl()!);
    }
    if (this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.pause();
      this.videoPlayer.nativeElement.removeAttribute('src');
      this.videoPlayer.nativeElement.load();
    }
  }

  onLoadedMetadata(event: Event) {
    const video = event.target as HTMLVideoElement;
    this.duration.set(video.duration);
    this.isLoading.set(false);
    this.durationDetected.emit(video.duration);
    
    // Basic metadata extraction from video element
    const meta: VideoMeta = {
      filename: this.file?.name || 'unknown',
      fileSizeMB: (this.file?.size || 0) / (1024 * 1024),
      duration: video.duration,
      width: video.videoWidth,
      height: video.videoHeight,
      fps: 30, // Default fallback, actual FPS requires ffprobe
      codec: 'unknown',
      audioCodec: null,
      audioBitrate: 0,
      videoBitrate: 0,
      hasAudio: true, // Assumption
      aspectRatio: `${video.videoWidth}:${video.videoHeight}`
    };
    this.metadataLoaded.emit(meta);
  }

  onTimeUpdate(event: Event) {
    const video = event.target as HTMLVideoElement;
    this.currentTimeSignal.set(video.currentTime);
  }

  onSeek(event: Event) {
    const input = event.target as HTMLInputElement;
    const time = parseFloat(input.value);
    if (this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.currentTime = time;
      this.videoSeeked.emit(time);
    }
  }

  togglePlay() {
    if (!this.videoPlayer?.nativeElement) return;
    
    if (this.videoPlayer.nativeElement.paused) {
      this.videoPlayer.nativeElement.play();
    } else {
      this.videoPlayer.nativeElement.pause();
    }
  }

  toggleMute() {
    if (!this.videoPlayer?.nativeElement) return;
    
    this.videoPlayer.nativeElement.muted = !this.videoPlayer.nativeElement.muted;
    this.isMuted.set(this.videoPlayer.nativeElement.muted);
  }

  formatTime(seconds: number): string {
    if (isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
}

