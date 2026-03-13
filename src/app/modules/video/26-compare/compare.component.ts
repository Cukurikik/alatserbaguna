import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';

interface CompareState { fileA: File|null; fileB: File|null; divider: number; }
const initialState: CompareState = { fileA: null, fileB: null, divider: 50 };

const CompareActions = createActionGroup({ source: 'Compare', events: {
  'Load A': props<{ file: File }>(),
  'Load B': props<{ file: File }>(),
  'Set Divider': props<{ divider: number }>(),
  'Reset State': emptyProps(),
}});

const compareFeature = createFeature({ name: 'compare', reducer: createReducer(initialState,
  on(CompareActions.loadA, (s, { file }) => ({ ...s, fileA: file })),
  on(CompareActions.loadB, (s, { file }) => ({ ...s, fileB: file })),
  on(CompareActions.setDivider, (s, { divider }) => ({ ...s, divider })),
  on(CompareActions.resetState, () => initialState),
)});

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent],
  template: `
    <div class="h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col overflow-y-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-teal-400 to-green-400 bg-clip-text text-transparent pb-1">Snapshot Compare</h2>
        <p class="text-gray-400 text-sm mt-1">Compare two videos side-by-side with an interactive drag divider for before/after analysis.</p>
      </div>

      @if (vm$ | async; as vm) {
        @if (!vm.fileA || !vm.fileB) {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            <div>
              <p class="text-xs font-semibold text-teal-400 mb-2 uppercase tracking-wider">Video A (Before)</p>
              @if (!vm.fileA) {
                <app-file-drop-zone accept="video/*" (fileDropped)="onFileA($event)"></app-file-drop-zone>
              } @else {
                <div class="bg-gray-800 border border-teal-600 rounded-xl p-4 flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-teal-900/40 flex items-center justify-center">
                    <span class="text-teal-400 font-bold text-sm">A</span>
                  </div>
                  <div><p class="text-white font-medium">{{ vm.fileA.name }}</p><p class="text-xs text-gray-400">{{ (vm.fileA.size / 1024 / 1024).toFixed(2) }} MB</p></div>
                </div>
              }
            </div>
            <div>
              <p class="text-xs font-semibold text-green-400 mb-2 uppercase tracking-wider">Video B (After)</p>
              @if (!vm.fileB) {
                <app-file-drop-zone accept="video/*" (fileDropped)="onFileB($event)"></app-file-drop-zone>
              } @else {
                <div class="bg-gray-800 border border-green-600 rounded-xl p-4 flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-green-900/40 flex items-center justify-center">
                    <span class="text-green-400 font-bold text-sm">B</span>
                  </div>
                  <div><p class="text-white font-medium">{{ vm.fileB.name }}</p><p class="text-xs text-gray-400">{{ (vm.fileB.size / 1024 / 1024).toFixed(2) }} MB</p></div>
                </div>
              }
            </div>
          </div>
        } @else {
          <!-- Split View with Drag Divider -->
          <div class="relative rounded-xl overflow-hidden border border-gray-700 bg-black flex-1 min-h-64">
            <!-- Video A -->
            <video [src]="urlA!" autoplay loop muted playsinline class="absolute inset-0 w-full h-full object-cover"></video>
            <!-- Video B (clipped) -->
            <div [style.width.%]="vm.divider" class="absolute inset-0 overflow-hidden">
              <video [src]="urlB!" autoplay loop muted playsinline class="absolute inset-0 w-full h-full object-cover" [style.min-width.%]="(100/(vm.divider/100))"></video>
            </div>
            <!-- Divider line -->
            <div [style.left.%]="vm.divider" class="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] pointer-events-none">
              <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center pointer-events-none">
                <svg class="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l-3 3 3 3m8-6l3 3-3 3"/></svg>
              </div>
            </div>
            <!-- Labels -->
            <div class="absolute top-3 left-3 bg-teal-600/90 text-white text-xs font-bold px-2 py-1 rounded">A: Before</div>
            <div class="absolute top-3 right-3 bg-green-600/90 text-white text-xs font-bold px-2 py-1 rounded">B: After</div>
          </div>
          <!-- Slider -->
          <div class="mt-4 bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div class="flex justify-between mb-2">
              <label class="text-sm font-semibold text-gray-300">Divider Position</label>
              <span class="text-teal-400 font-mono">{{ vm.divider }}%</span>
            </div>
            <input type="range" min="5" max="95" [value]="vm.divider" (input)="setDivider($event)" class="w-full accent-teal-400">
          </div>
          <button (click)="onReset()" class="mt-4 text-sm text-center text-gray-400 hover:text-white">Compare Different Videos</button>
        }
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompareComponent {
  private store = inject(Store);
  readonly vm$ = this.store.select(compareFeature.selectCompareState);
  urlA: string | null = null;
  urlB: string | null = null;

  onFileA(file: File): void { if (this.urlA) URL.revokeObjectURL(this.urlA); this.urlA = URL.createObjectURL(file); this.store.dispatch(CompareActions.loadA({ file })); }
  onFileB(file: File): void { if (this.urlB) URL.revokeObjectURL(this.urlB); this.urlB = URL.createObjectURL(file); this.store.dispatch(CompareActions.loadB({ file })); }
  setDivider(e: Event): void { this.store.dispatch(CompareActions.setDivider({ divider: +(e.target as HTMLInputElement).value })); }
  onReset(): void { if (this.urlA) URL.revokeObjectURL(this.urlA); if (this.urlB) URL.revokeObjectURL(this.urlB); this.urlA = null; this.urlB = null; this.store.dispatch(CompareActions.resetState()); }
}