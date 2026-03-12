import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../shared/components/react-bridge/react-bridge.component';
import WatermarkPage from '../../../../react-features/video/tools/17-watermark/WatermarkPage';

@Component({
  selector: 'app-watermark-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="WatermarkPage" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WatermarkWrapperComponent {
  WatermarkPage = WatermarkPage;
}
