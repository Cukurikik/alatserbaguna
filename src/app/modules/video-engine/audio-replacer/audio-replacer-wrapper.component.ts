import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../shared/components/react-bridge/react-bridge.component';
import AudioReplacerPage from '../../../../react-features/video/tools/16-audio-replacer/AudioReplacerPage';

@Component({
  selector: 'app-audio-replacer-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="AudioReplacerPage" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AudioReplacerWrapperComponent {
  AudioReplacerPage = AudioReplacerPage;
}
