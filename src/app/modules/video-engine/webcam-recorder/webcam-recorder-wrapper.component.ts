import { Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../shared/components/react-bridge/react-bridge.component';
import { WebcamRecorderPage } from '../../../../react-features/video/tools/29-webcam-recorder/WebcamRecorderPage';

@Component({
  selector: 'app-webcam-recorder-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="WebcamRecorderPage"></app-react-bridge>`
})
export class WebcamRecorderWrapperComponent {
  WebcamRecorderPage = WebcamRecorderPage;
}
