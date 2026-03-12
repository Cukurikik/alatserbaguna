import { Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../shared/components/react-bridge/react-bridge.component';
import { ObjectRemoverPage } from '../../../../react-features/video/tools/24-object-remover/ObjectRemoverPage';

@Component({
  selector: 'app-object-remover-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="ObjectRemoverPage"></app-react-bridge>`
})
export class ObjectRemoverWrapperComponent {
  ObjectRemoverPage = ObjectRemoverPage;
}
