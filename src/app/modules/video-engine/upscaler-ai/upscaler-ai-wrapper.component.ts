import { Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../shared/components/react-bridge/react-bridge.component';
import { UpscalerPage } from '../../../../react-features/video/tools/22-upscaler-ai/UpscalerPage';

@Component({
  selector: 'app-upscaler-ai-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="UpscalerPage"></app-react-bridge>`
})
export class UpscalerAiWrapperComponent {
  UpscalerPage = UpscalerPage;
}
