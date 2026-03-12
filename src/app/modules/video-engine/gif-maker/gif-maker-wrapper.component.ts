import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../shared/components/react-bridge/react-bridge.component';
import GifMakerPage from '../../../../react-features/video/tools/13-gif-maker/GifMakerPage';

@Component({
  selector: 'app-gif-maker-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="GifMakerPage" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GifMakerWrapperComponent {
  GifMakerPage = GifMakerPage;
}
