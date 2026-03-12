import { Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../shared/components/react-bridge/react-bridge.component';
import { SceneDetectorPage } from '../../../../react-features/video/tools/25-scene-detector/SceneDetectorPage';

@Component({
  selector: 'app-scene-detector-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="SceneDetectorPage"></app-react-bridge>`
})
export class SceneDetectorWrapperComponent {
  SceneDetectorPage = SceneDetectorPage;
}
