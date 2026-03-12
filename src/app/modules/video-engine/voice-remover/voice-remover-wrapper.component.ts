import { Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../shared/components/react-bridge/react-bridge.component';
import { VoiceRemoverPage } from '../../../../react-features/video/tools/26-voice-remover/VoiceRemoverPage';

@Component({
  selector: 'app-voice-remover-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="VoiceRemoverPage"></app-react-bridge>`
})
export class VoiceRemoverWrapperComponent {
  VoiceRemoverPage = VoiceRemoverPage;
}
