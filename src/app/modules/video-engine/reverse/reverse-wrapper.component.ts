import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../shared/components/react-bridge/react-bridge.component';
import { ReversePage } from '../../../../react-features/video/tools/08-reverse';

@Component({
  selector: 'app-reverse-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="ReversePage" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReverseWrapperComponent {
  ReversePage = ReversePage;
}
