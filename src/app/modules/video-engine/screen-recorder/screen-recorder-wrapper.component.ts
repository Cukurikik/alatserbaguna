import { Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../shared/components/react-bridge/react-bridge.component';
import { ScreenRecorderPage } from '../../../../react-features/video/tools/28-screen-recorder/ScreenRecorderPage';

@Component({
  selector: 'app-screen-recorder-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="ScreenRecorderPage"></app-react-bridge>`
})
export class ScreenRecorderWrapperComponent {
  ScreenRecorderPage = ScreenRecorderPage;
}
