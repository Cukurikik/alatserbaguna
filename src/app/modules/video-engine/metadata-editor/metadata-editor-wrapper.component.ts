import { Component } from '@angular/core';
import { ReactBridgeComponent } from '../../../shared/components/react-bridge/react-bridge.component';
import { MetadataEditorPage } from '../../../../react-features/video/tools/27-metadata-editor/MetadataEditorPage';

@Component({
  selector: 'app-metadata-editor-wrapper',
  standalone: true,
  imports: [ReactBridgeComponent],
  template: `<app-react-bridge [component]="MetadataEditorPage"></app-react-bridge>`
})
export class MetadataEditorWrapperComponent {
  MetadataEditorPage = MetadataEditorPage;
}
