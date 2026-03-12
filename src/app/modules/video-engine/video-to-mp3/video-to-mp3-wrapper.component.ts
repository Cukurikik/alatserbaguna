import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../shared/components/react-bridge/react-bridge.component';
import VideoToMp3Page from '../../../../react-features/video/tools/15-video-to-mp3/VideoToMp3Page';

@Component({
  selector: 'app-video-to-mp3-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="VideoToMp3Page" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoToMp3WrapperComponent {
  VideoToMp3Page = VideoToMp3Page;
}
