import { Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../../shared/components/react-bridge/react-bridge.component';
import { AutoSubtitlePage } from '../../../../react-features/video/tools/34-auto-subtitle';

@Component({
  selector: 'app-auto-subtitle-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="reactComponent" />`
})
export class AutoSubtitleWrapperComponent {
  reactComponent = AutoSubtitlePage;
}
