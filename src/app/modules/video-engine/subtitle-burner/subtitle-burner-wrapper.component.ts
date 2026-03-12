import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../shared/components/react-bridge/react-bridge.component';
import { SubtitleBurnerPage } from '../../../../react-features/video/tools/11-subtitle-burner';

@Component({
  selector: 'app-subtitle-burner-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="SubtitleBurnerPage" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubtitleBurnerWrapperComponent {
  SubtitleBurnerPage = SubtitleBurnerPage;
}
