import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HowItWorksSubItemIcon } from '../how-it-works.types';
import { IconClipboardListComponent } from '../../../../../shared/icons/clipboard-list.icon';
import { IconEyeOutlineComponent } from '../../../../../shared/icons/eye-outline.icon';
import { IconCheckStrokeComponent } from '../../../../../shared/icons/check-stroke.icon';

@Component({
  selector: 'app-how-it-works-flow-icon',
  standalone: true,
  imports: [
    CommonModule,
    IconClipboardListComponent,
    IconEyeOutlineComponent,
    IconCheckStrokeComponent,
  ],
  templateUrl: './how-it-works-flow-icon.component.html',
  styleUrls: ['./how-it-works-flow-icon.component.scss'],
})
export class HowItWorksFlowIconComponent {
  @Input() icon?: HowItWorksSubItemIcon;

  isOutlineIcon(): boolean {
    return (
      this.icon === 'upload' ||
      this.icon === 'clipboard' ||
      this.icon === 'send' ||
      this.icon === 'eye'
    );
  }
}
