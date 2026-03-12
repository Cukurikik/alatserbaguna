import { Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../shared/components/react-bridge/react-bridge.component';
import { BackgroundBlurPage } from '../../../../react-features/video/tools/23-background-blur/BackgroundBlurPage';

@Component({
  selector: 'app-background-blur-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="BackgroundBlurPage"></app-react-bridge>`
})
export class BackgroundBlurWrapperComponent {
  BackgroundBlurPage = BackgroundBlurPage;
}
