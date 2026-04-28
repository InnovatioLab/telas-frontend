import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { filter } from "rxjs/operators";
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
  private readonly router = inject(Router);
  private readonly url = signal(this.router.url);

  readonly isClientMapHome = computed(() => {
    const path = this.url().split("?")[0];
    return path === "/client" || path === "/client/";
  });

  constructor(private readonly cartService: CartService) {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.url.set(this.router.url));
  }

  ngOnInit(): void {
    this.cartService.refreshActiveCart().subscribe({ error: () => {} });
  }

  onMonitorsFound(monitors: MapPoint[]): void {}
}
