import { Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../../shared/components/react-bridge/react-bridge.component';
import { SilenceRemoverPage } from '../../../../react-features/video/tools/35-silence-remover';

@Component({
  selector: 'app-silence-remover-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="reactComponent" />`
})
export class SilenceRemoverWrapperComponent {
  reactComponent = SilenceRemoverPage;
}
