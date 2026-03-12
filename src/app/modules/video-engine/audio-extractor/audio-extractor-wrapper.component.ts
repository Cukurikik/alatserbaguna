import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../shared/components/react-bridge/react-bridge.component';
import AudioExtractorPage from '../../../../react-features/video/tools/14-audio-extractor/AudioExtractorPage';

@Component({
  selector: 'app-audio-extractor-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="AudioExtractorPage" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AudioExtractorWrapperComponent {
  AudioExtractorPage = AudioExtractorPage;
}
