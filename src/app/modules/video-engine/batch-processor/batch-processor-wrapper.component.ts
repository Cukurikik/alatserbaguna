import { Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../../shared/components/react-bridge/react-bridge.component';
import { BatchProcessorPage } from '../../../../../react-features/video/tools/32-batch-processor';

@Component({
  selector: 'app-batch-processor-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="reactComponent" />`
})
export class BatchProcessorWrapperComponent {
  reactComponent = BatchProcessorPage;
}
