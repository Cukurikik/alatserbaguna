import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ReactBridgeComponent } from '../../../shared/components/react-bridge/react-bridge.component';
import { MergerPage } from '../../../../react-features/video/tools/02-merger';

@Component({
  selector: 'app-merger-wrapper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactBridgeComponent],
  template: `
    <div class="w-full h-full min-h-screen p-4 md:p-8">
      <app-react-bridge [component]="reactComponent" [props]="{}"></app-react-bridge>
    </div>
  `
})
export class MergerWrapperComponent {
  reactComponent = MergerPage;
}
