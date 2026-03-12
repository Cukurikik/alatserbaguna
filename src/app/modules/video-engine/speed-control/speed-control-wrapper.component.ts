import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../shared/components/react-bridge/react-bridge.component';
import { SpeedControlPage } from '../../../../react-features/video/tools/07-speed-control';

@Component({
  selector: 'app-speed-control-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="SpeedControlPage" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpeedControlWrapperComponent {
  SpeedControlPage = SpeedControlPage;
}
