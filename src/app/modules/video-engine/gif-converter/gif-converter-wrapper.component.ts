import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../shared/components/react-bridge/react-bridge.component';
import GifConverterPage from '../../../../react-features/video/tools/18-gif-converter/GifConverterPage';

@Component({
  selector: 'app-gif-converter-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="GifConverterPage" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GifConverterWrapperComponent {
  GifConverterPage = GifConverterPage;
}
