import { Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../../shared/components/react-bridge/react-bridge.component';
import { PipOverlayPage } from '../../../../react-features/video/tools/31-pip-overlay';

@Component({
  selector: 'app-pip-overlay-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="reactComponent" />`
})
export class PipOverlayWrapperComponent {
  reactComponent = PipOverlayPage;
}
