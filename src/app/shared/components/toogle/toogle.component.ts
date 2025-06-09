import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToggleModeService } from '@app/core/service/state/toggle-mode.service';
import { IconSunComponent } from '../../icons/sun.icon';
import { IconMoonComponent } from '../../icons/moon.icon';

@Component({
  selector: 'ui-toggle',
  templateUrl: './toogle.component.html',
  styleUrls: ['./toogle.component.scss'],
  standalone: true,
  imports: [CommonModule, IconSunComponent, IconMoonComponent]
})
export class ToggleComponent implements OnInit {
  isDarkMode = false;

  constructor(private readonly toggleModeService: ToggleModeService) {}

  ngOnInit(): void {
    this.toggleModeService.theme$.subscribe((theme: string) => {
      this.isDarkMode = theme === 'dark';
    });
  }

  toggleDarkMode(): void {
    this.toggleModeService.switchThemeMode(this.isDarkMode ? 'light' : 'dark');
  }
}
