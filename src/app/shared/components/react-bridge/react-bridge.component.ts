import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  ViewChild,
  AfterViewInit,
  inject,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { createElement } from 'react';
import type { ElementType } from 'react';

@Component({
  selector: 'app-react-bridge',
  standalone: true,
  template: `<div #reactContainer class="w-full h-full"></div>`
})
export class ReactBridgeComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @ViewChild('reactContainer', { static: true }) containerRef!: ElementRef;
  
  @Input() component!: ElementType;
  @Input() props: Record<string, unknown> = {};

  private platformId = inject(PLATFORM_ID);
  private root: Root | null = null;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.renderReactComponent();
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.renderReactComponent();
    }
  }

  ngOnChanges() {
    if (isPlatformBrowser(this.platformId) && this.root) {
      this.renderReactComponent();
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId) && this.root) {
      this.root.unmount();
    }
  }

  private renderReactComponent() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.containerRef || !this.containerRef.nativeElement) return;
    
    if (!this.root) {
      this.root = createRoot(this.containerRef.nativeElement);
    }
    
    this.root.render(createElement(this.component, this.props));
  }
}
