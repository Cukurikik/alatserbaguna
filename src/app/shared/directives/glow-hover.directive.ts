import { Directive, ElementRef, HostListener, Renderer2, inject } from '@angular/core';

@Directive({
  selector: '[appGlowHover]',
  standalone: true
})
export class GlowHoverDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  constructor() {
    this.renderer.addClass(this.el.nativeElement, 'transition-all');
    this.renderer.addClass(this.el.nativeElement, 'duration-300');
  }

  @HostListener('mouseenter') onMouseEnter() {
    this.renderer.addClass(this.el.nativeElement, 'shadow-glow');
    this.renderer.addClass(this.el.nativeElement, '-translate-y-1');
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.renderer.removeClass(this.el.nativeElement, 'shadow-glow');
    this.renderer.removeClass(this.el.nativeElement, '-translate-y-1');
  }
}
