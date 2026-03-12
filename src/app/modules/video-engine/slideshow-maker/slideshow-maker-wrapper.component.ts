import { Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../shared/components/react-bridge/react-bridge.component';
import { SlideshowMakerPage } from '../../../../react-features/video/tools/30-slideshow-maker/SlideshowMakerPage';

@Component({
  selector: 'app-slideshow-maker-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="SlideshowMakerPage"></app-react-bridge>`
})
export class SlideshowMakerWrapperComponent {
  SlideshowMakerPage = SlideshowMakerPage;
}
