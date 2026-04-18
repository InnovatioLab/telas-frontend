import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Inject,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { SliceStringPipe } from "@app/core/pipes/slice-string.pipe";
import { CartService } from "@app/core/service/api/cart.service";
import { ClientService } from "@app/core/service/api/client.service";
import { GoogleMapsService } from "@app/core/service/api/google-maps.service";
import { MapPoint } from "@app/core/service/state/map-point.interface";
import { ToastService } from "@app/core/service/state/toast.service";
import { CartRequestDto } from "@app/model/dto/request/cart-request.dto";
import { CartResponseDto } from "@app/model/dto/response/cart-response.dto";
import { Recurrence } from "@app/model/enums/recurrence.enum";
import { IconCheckComponent } from "@app/shared/icons/check.icon";
import { IconClockComponent } from "@app/shared/icons/clock.icon";
import { IconsModule } from "@app/shared/icons/icons.module";
import { IconWarningComponent } from "@app/shared/icons/warning.icon";
import { Subscription } from "rxjs";
import { ENVIRONMENT } from "src/environments/environment-token";
import { Environment } from "src/environments/environment";
import { PrimengModule } from "../../primeng/primeng.module";

@Component({
  selector: "app-sidebar-mapa",
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    IconsModule,
    IconCheckComponent,
    IconWarningComponent,
    IconClockComponent,
    SliceStringPipe,
  ],
  templateUrl: "./sidebar-mapa.component.html",
  styleUrls: ["./sidebar-mapa.component.scss"],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SidebarMapaComponent implements OnInit, OnDestroy {
  visibilidadeSidebar = false;
  pontoSelecionado: MapPoint | null = null;
  private locationPhotoFailed = false;

  localInfo: {
    name?: string;
    description?: string;
    formattedAddress?: string;
  } | null = null;
  loadingLocationInfo = false;

  private readonly subscriptions = new Subscription();

  constructor(
    private readonly mapsService: GoogleMapsService,
    private readonly cartService: CartService,
    @Inject(ENVIRONMENT) private readonly env: Environment,
    private readonly toastService: ToastService,
    private readonly cdr: ChangeDetectorRef,
    private readonly clientService: ClientService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.mapsService.selectedPoint$.subscribe((point) => {
        if (point && !this.pontoSelecionado) {
          this.resetLocationPhotoState();
          this.pontoSelecionado = point;
          this.openSidebar();
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 100);
        }
      })
    );

    window.addEventListener("monitor-marker-clicked", ((e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.point && !this.pontoSelecionado) {
        this.resetLocationPhotoState();
        this.pontoSelecionado = customEvent.detail.point;
        this.openSidebar();
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 100);
      }
    }) as EventListener);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  openSidebar(): void {
    this.visibilidadeSidebar = true;
  }

  closeSidebar(): void {
    this.visibilidadeSidebar = false;
    this.mapsService.selectPoint(null);
    this.localInfo = null;
    this.pontoSelecionado = null;
    this.resetLocationPhotoState();
  }

  voltar(): void {
    this.closeSidebar();
  }

  getMonitorData(): any {
    if (this.pontoSelecionado?.data) {
      return this.pontoSelecionado.data;
    }
    return null;
  }

  addToList(): void {
    if (this.pontoSelecionado) {
      const monitorToAdd = this.pontoSelecionado;
      this.addToCart(monitorToAdd);
      this.closeSidebar();
    }
  }

  private addToCart(monitor: MapPoint): void {
    this.cartService.getLoggedUserCart().subscribe({
      next: (activeCart) => {
        if (activeCart) {
          this.updateExistingCart(activeCart, monitor);
        } else {
          this.createNewCart(monitor);
        }
      },
      error: () => {
        this.createNewCart(monitor);
      },
    });
  }

  private createNewCart(monitor: MapPoint): void {
    const cartRequest: CartRequestDto = {
      recurrence: Recurrence.MONTHLY,
      items: [
        {
          monitorId: monitor.id,
          blockQuantity: 1,
        },
      ],
    };

    this.cartService.addToCart(cartRequest).subscribe({
      next: () => {
        this.toastService.sucesso("Screen added to cart");
      },
      error: (error) => {
        this.toastService.erro("Error adding to cart");
      },
    });
  }

  private updateExistingCart(
    activeCart: CartResponseDto,
    monitor: MapPoint
  ): void {
    const existingItem = activeCart.items.find(
      (item) => item.monitorId === monitor.id
    );

    if (!existingItem) {
      const updatedItems = [
        ...activeCart.items.map((item) => ({
          monitorId: item.monitorId,
          blockQuantity: item.blockQuantity,
        })),
        {
          monitorId: monitor.id,
          blockQuantity: 1,
        },
      ];

      const cartRequest: CartRequestDto = {
        recurrence: activeCart.recurrence,
        items: updatedItems,
      };

      this.cartService.update(cartRequest, activeCart.id).subscribe({
        next: () => {
          this.toastService.sucesso("Cart updated successfully");
        },
        error: (error) => {
          this.toastService.erro("Error updating cart");
        },
      });
    }
  }

  addToWishlist(): void {
    if (this.pontoSelecionado) {
      const monitorToAdd = this.pontoSelecionado;
      this.clientService.addToWishlist(monitorToAdd.id).subscribe({
        next: () => {
          this.toastService.sucesso("Screen added to wishlist");
        },
        error: (error) => {
          this.toastService.erro("Error adding to wishlist");
        },
      });
    }
  }

  resolveLocationPhotoUrl(): string | null {
    const data = this.getMonitorData();
    const raw = data?.photoUrl ?? this.pontoSelecionado?.photoUrl;
    if (raw == null || !String(raw).trim()) {
      return null;
    }
    const u = String(raw).trim();
    if (/^https?:\/\//i.test(u)) {
      return u;
    }
    try {
      const origin = new URL(this.env.apiUrl).origin;
      return u.startsWith("/") ? origin + u : `${origin}/${u}`;
    } catch {
      return u;
    }
  }

  canShowLocationPhoto(): boolean {
    const url = this.resolveLocationPhotoUrl();
    return url != null && url.length > 0 && !this.locationPhotoFailed;
  }

  onLocationPhotoError(): void {
    this.locationPhotoFailed = true;
    this.cdr.detectChanges();
  }

  private resetLocationPhotoState(): void {
    this.locationPhotoFailed = false;
  }
}
