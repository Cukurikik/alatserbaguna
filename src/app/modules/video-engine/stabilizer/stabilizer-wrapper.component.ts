import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../shared/components/react-bridge/react-bridge.component';
import { StabilizerPage } from '../../../../react-features/video/tools/10-stabilizer';

@Component({
  selector: 'app-stabilizer-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="StabilizerPage" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StabilizerWrapperComponent {
  StabilizerPage = StabilizerPage;
}
