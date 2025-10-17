import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ContentWrapperComponent } from "@app/shared/components/content-wrapper/content-wrapper.component";
import { HeaderComponent } from "@app/shared/components/header/header.component";
import { MenuComponent } from "@app/shared/components/menu/menu.component";
import { RodapeComponent } from "@app/shared/components/rodape/rodape.component";
import { SearchSectionComponent } from "@app/shared/components/search-section/search-section.component";
import { MapPoint } from "@app/core/service/state/map-point.interface";

@Component({
  selector: "app-client-view-layout",
  templateUrl: "./client-view-layout.component.html",
  styleUrls: ["./client-view-layout.component.scss"],
  standalone: true,
  imports: [
    HeaderComponent,
    SearchSectionComponent,
    RouterModule,
    MenuComponent,
    ContentWrapperComponent,
    RodapeComponent,
  ],
})
export class ClientViewLayoutComponent {
  onMonitorsFound(monitors: MapPoint[]): void {
    // Emit event to child components or handle the monitors data
    console.log('Monitors found:', monitors);
    // You can emit this to other components or handle the data as needed
  }
}
