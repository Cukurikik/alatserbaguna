import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, OnDestroy, signal, SimpleChanges } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-audio-player',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (audioBlob) {
      <div class="bg-gray-900/60 rounded-2xl p-4 border border-gray-800">
        <audio #audioEl [src]="blobUrl" [loop]="loop" (timeupdate)="onTimeUpdate(audioEl)"
               (loadedmetadata)="onMeta(audioEl)" (ended)="playing.set(false)" class="hidden"></audio>
        <div class="flex items-center gap-4">
          <button (click)="toggle(audioEl)"
            class="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/30 transition-colors shrink-0">
            {{ playing() ? '⏸' : '▶' }}
          </button>
          <div class="flex-1">
            <input type="range" min="0" [max]="duration()" step="0.01" [value]="currentTime()"
                   (input)="seek(audioEl, $event)"
                   class="w-full h-1 bg-gray-700 rounded appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full cursor-pointer">
          </div>
          <span class="text-xs text-gray-400 font-mono shrink-0">{{ fmt(currentTime()) }} / {{ fmt(duration()) }}</span>
        </div>
      </div>
    }
  `
})
export class AudioPlayerComponent implements OnChanges, OnDestroy {
  @Input() audioBlob: Blob | null = null;
  @Input() loop = false;
  blobUrl: string | null = null;
  playing = signal(false);
  currentTime = signal(0);
  duration = signal(0);

  ngOnChanges(c: SimpleChanges) {
    if (c['audioBlob']) {
      if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = this.audioBlob ? URL.createObjectURL(this.audioBlob) : null;
      this.playing.set(false); this.currentTime.set(0); this.duration.set(0);
    }
  }
  ngOnDestroy() { if (this.blobUrl) URL.revokeObjectURL(this.blobUrl); }
  toggle(el: HTMLAudioElement) { el.paused ? (el.play(), this.playing.set(true)) : (el.pause(), this.playing.set(false)); }
  onTimeUpdate(el: HTMLAudioElement) { this.currentTime.set(el.currentTime); }
  onMeta(el: HTMLAudioElement) { this.duration.set(el.duration); }
  seek(el: HTMLAudioElement, e: Event) { el.currentTime = Number((e.target as HTMLInputElement).value); }
  fmt(s: number): string {
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }
}
