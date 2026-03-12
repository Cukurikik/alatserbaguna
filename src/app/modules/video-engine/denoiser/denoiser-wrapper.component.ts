import { Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../shared/components/react-bridge/react-bridge.component';
import { DenoiserPage } from '../../../../react-features/video/tools/21-denoiser/DenoiserPage';

@Component({
  selector: 'app-denoiser-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="DenoiserPage"></app-react-bridge>`
})
export class DenoiserWrapperComponent {
  DenoiserPage = DenoiserPage;
}
