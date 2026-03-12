import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../shared/components/react-bridge/react-bridge.component';
import ThumbnailGenPage from '../../../../react-features/video/tools/12-thumbnail-gen/ThumbnailGenPage';

@Component({
  selector: 'app-thumbnail-gen-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="ThumbnailGenPage" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThumbnailGenWrapperComponent {
  ThumbnailGenPage = ThumbnailGenPage;
}
