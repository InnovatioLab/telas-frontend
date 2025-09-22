import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LayoutService } from '@app/core/service/state/layout.service';
import { SettingsSideBarComponent } from '@app/shared/components/settings-side-bar/settings-side-bar.component';

@Component({
  selector: "app-settings-layout",
  templateUrl: "./settings-layout.component.html",
  styleUrls: ["./settings-layout.component.scss"],
  standalone: true,
  imports: [CommonModule, RouterModule, SettingsSideBarComponent],
})
export class SettingsLayoutComponent {
  private readonly layoutService = inject(LayoutService);

  isMenuOpen = this.layoutService.isMenuOpen;
  isMobile = this.layoutService.isMobile;
  isMobileCompact = this.layoutService.isMobileCompact;
  contentPadding = this.layoutService.contentMargin;
}
