import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ReactBridgeComponent } from '../../../shared/components/react-bridge/react-bridge.component';
import { ConverterPage } from '../../../../react-features/video/tools/03-converter';

@Component({
  selector: 'app-converter-wrapper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactBridgeComponent],
  template: `
    <div class="w-full h-full min-h-screen p-4 md:p-8">
      <app-react-bridge [component]="reactComponent" [props]="{}"></app-react-bridge>
    </div>
  `
})
export class ConverterWrapperComponent {
  reactComponent = ConverterPage;
}
