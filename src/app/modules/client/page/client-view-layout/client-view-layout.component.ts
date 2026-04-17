import { Component, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { CartService } from "@app/core/service/api/cart.service";
import { MapPoint } from "@app/core/service/state/map-point.interface";
import { ContentWrapperComponent } from "@app/shared/components/content-wrapper/content-wrapper.component";
import { HeaderComponent } from "@app/shared/components/header/header.component";
import { MenuComponent } from "@app/shared/components/menu/menu.component";
import { RodapeComponent } from "@app/shared/components/rodape/rodape.component";

@Component({
  selector: "app-client-view-layout",
  templateUrl: "./client-view-layout.component.html",
  styleUrls: ["./client-view-layout.component.scss"],
  standalone: true,
  imports: [
    HeaderComponent,
    RouterModule,
    MenuComponent,
    ContentWrapperComponent,
    RodapeComponent,
  ],
})
export class ClientViewLayoutComponent implements OnInit {
  constructor(private readonly cartService: CartService) {}

  ngOnInit(): void {
    this.cartService.refreshActiveCart().subscribe({ error: () => {} });
  }

  onMonitorsFound(monitors: MapPoint[]): void {}
}
