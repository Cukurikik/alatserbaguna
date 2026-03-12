import { Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../../shared/components/react-bridge/react-bridge.component';
import { ComparisonPage } from '../../../../../react-features/video/tools/33-comparison';

@Component({
  selector: 'app-comparison-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="reactComponent" />`
})
export class ComparisonWrapperComponent {
  reactComponent = ComparisonPage;
}
