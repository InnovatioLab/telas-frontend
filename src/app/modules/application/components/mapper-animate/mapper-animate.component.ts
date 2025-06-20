import { Component } from '@angular/core';
import { IconsModule } from '@app/shared/icons/icons.module';
import { MapsComponent } from '@app/shared/components/maps/maps.component';

@Component({
  selector: 'app-mapper-animate',
  templateUrl: './mapper-animate.component.html',
  styleUrls: ['./mapper-animate.component.scss'],
  standalone: true,
  imports: [IconsModule, MapsComponent],
})
export class MapperAnimateComponent {}
