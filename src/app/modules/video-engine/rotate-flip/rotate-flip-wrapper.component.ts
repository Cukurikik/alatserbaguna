import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../shared/components/react-bridge/react-bridge.component';
import { RotateFlipPage } from '../../../../react-features/video/tools/06-rotate-flip';

@Component({
  selector: 'app-rotate-flip-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="RotateFlipPage" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RotateFlipWrapperComponent {
  RotateFlipPage = RotateFlipPage;
}
