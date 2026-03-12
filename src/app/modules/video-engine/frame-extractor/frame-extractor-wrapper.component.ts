import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../shared/components/react-bridge/react-bridge.component';
import FrameExtractorPage from '../../../../react-features/video/tools/19-frame-extractor/FrameExtractorPage';

@Component({
  selector: 'app-frame-extractor-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="FrameExtractorPage" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FrameExtractorWrapperComponent {
  FrameExtractorPage = FrameExtractorPage;
}
