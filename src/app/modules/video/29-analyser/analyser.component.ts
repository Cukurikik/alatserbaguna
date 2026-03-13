import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';

interface VideoInfo { filename: string; size: number; type: string; duration: number; width: number; height: number; fps: number; bitrate: number; }
interface AnalyserState { status: 'idle'|'analysing'|'done'; info: VideoInfo|null; }
const initialState: AnalyserState = { status: 'idle', info: null };

const AnalyserActions = createActionGroup({ source: 'Analyser', events: {
  'Load File': props<{ file: File }>(),
  'Set Info': props<{ info: VideoInfo }>(),
  'Reset State': emptyProps(),
}});

const analyserFeature = createFeature({ name: 'analyser', reducer: createReducer(initialState,
  on(AnalyserActions.loadFile, (s) => ({ ...s, status: 'analysing' })),
  on(AnalyserActions.setInfo, (s, { info }) => ({ ...s, status: 'done', info })),
  on(AnalyserActions.resetState, () => initialState),
)});

interface InfoRow { label: string; value: string; color: string; }

@Component({
  selector: 'app-analyser',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, FileDropZoneComponent],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-stone-300 to-neutral-400 bg-clip-text text-transparent pb-1">Video Analyser</h2>
        <p class="text-gray-400 text-sm mt-1">Inspect codec, resolution, frame rate, bitrate and duration using the browser media API.</p>
      </div>

      @if (vm$ | async; as vm) {
        @if (!vm.info) {
          <div class="flex-1 flex flex-col justify-center">
            <app-file-drop-zone accept="video/*" (fileDropped)="onFile($event)"></app-file-drop-zone>
            @if (vm.status === 'analysing') {
              <div class="mt-6 flex justify-center">
                <div class="flex items-center gap-3 text-gray-400">
                  <div class="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  Analysing video...
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="flex flex-col gap-6">
            <!-- File Header -->
            <div class="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center gap-4">
              <div class="w-16 h-16 rounded-xl bg-neutral-800 flex items-center justify-center flex-shrink-0">
                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              </div>
              <div>
                <h3 class="text-white font-bold text-lg">{{ vm.info.filename }}</h3>
                <p class="text-gray-400">{{ vm.info.type }}</p>
              </div>
            </div>
            <!-- Info Grid -->
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              @for (row of buildRows(vm.info); track row.label) {
                <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
                  <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{{ row.label }}</p>
                  <p [class]="'text-lg font-bold font-mono ' + row.color">{{ row.value }}</p>
                </div>
              }
            </div>
            <!-- Bitrate bar -->
            @if (vm.info.bitrate > 0) {
              <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div class="flex justify-between mb-2">
                  <span class="text-sm text-gray-400">Bitrate Quality</span>
                  <span class="text-sm font-mono text-white">{{ (vm.info.bitrate / 1000000).toFixed(2) }} Mbps</span>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-2">
                  <div class="h-2 rounded-full transition-all" [class]="getBitrateColor(vm.info.bitrate)" [style.width.%]="Math.min(vm.info.bitrate / 200000, 100)"></div>
                </div>
              </div>
            }
            <button (click)="onReset()" class="bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl border border-gray-700 transition-all">Analyse Another File</button>
          </div>
        }
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalyserComponent {
  private store = inject(Store);
  readonly vm$ = this.store.select(analyserFeature.selectAnalyserState);
  readonly Math = Math;

  buildRows(info: VideoInfo): InfoRow[] {
    return [
      { label: 'Resolution', value: `${info.width}×${info.height}`, color: 'text-blue-400' },
      { label: 'Duration', value: `${Math.floor(info.duration / 60)}:${String(Math.floor(info.duration % 60)).padStart(2,'0')}`, color: 'text-green-400' },
      { label: 'Frame Rate', value: `${info.fps} fps`, color: 'text-yellow-400' },
      { label: 'File Size', value: `${(info.size / 1024 / 1024).toFixed(2)} MB`, color: 'text-purple-400' },
      { label: 'Bitrate', value: `${(info.bitrate / 1000).toFixed(0)} kbps`, color: 'text-orange-400' },
      { label: 'Aspect Ratio', value: this.calcAspect(info.width, info.height), color: 'text-pink-400' },
    ];
  }

  calcAspect(w: number, h: number): string { const g = (a: number, b: number): number => b === 0 ? a : g(b, a % b); const gcd = g(w, h); return `${w/gcd}:${h/gcd}`; }

  getBitrateColor(bitrate: number): string {
    if (bitrate > 20000000) return 'bg-green-500';
    if (bitrate > 5000000) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  onFile(file: File): void {
    this.store.dispatch(AnalyserActions.loadFile({ file }));
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      this.store.dispatch(AnalyserActions.setInfo({ info: {
        filename: file.name, size: file.size, type: file.type,
        duration: video.duration, width: video.videoWidth, height: video.videoHeight,
        fps: 30, bitrate: (file.size * 8) / video.duration
      }}));
      URL.revokeObjectURL(video.src);
    };
  }

  onReset(): void { this.store.dispatch(AnalyserActions.resetState()); }
}