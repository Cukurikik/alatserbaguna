import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../shared/components/react-bridge/react-bridge.component';
import { LoopPage } from '../../../../react-features/video/tools/09-loop';

@Component({
  selector: 'app-loop-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="LoopPage" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoopWrapperComponent {
  LoopPage = LoopPage;
}
