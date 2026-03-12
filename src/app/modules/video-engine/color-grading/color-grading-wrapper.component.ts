import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../shared/components/react-bridge/react-bridge.component';
import ColorGradingPage from '../../../../react-features/video/tools/20-color-grading/ColorGradingPage';

@Component({
  selector: 'app-color-grading-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="ColorGradingPage" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorGradingWrapperComponent {
  ColorGradingPage = ColorGradingPage;
}
