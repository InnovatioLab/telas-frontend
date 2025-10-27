import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconsModule } from '@app/shared/icons/icons.module';
import { GeolocationService, GeolocationPosition } from '@app/core/service/geolocation.service';

@Component({
  selector: 'app-mapper-animate',
  templateUrl: './mapper-animate.component.html',
  styleUrls: ['./mapper-animate.component.scss'],
  standalone: true,
  imports: [CommonModule, IconsModule],
})
export class MapperAnimateComponent implements OnInit {
  userLocation: GeolocationPosition | null = null;
  isLocationRequested = false;

  constructor(private readonly geolocationService: GeolocationService) {}

  async ngOnInit(): Promise<void> {
    await this.requestUserLocation();
  }

  private async requestUserLocation(): Promise<void> {
    try {
      this.isLocationRequested = true;
      const position = await this.geolocationService.getCurrentPosition();
      this.userLocation = position;
    } catch (error) {
      this.userLocation = this.geolocationService.getDefaultLocation();
    }
  }
}
