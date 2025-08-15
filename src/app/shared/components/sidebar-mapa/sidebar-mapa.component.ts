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
import { MapPoint } from "@app/core/service/state/map-point.interface";
import { ToastService } from "@app/core/service/state/toast.service";
import { CartRequestDto } from "@app/model/dto/request/cart-request.dto";
import { CartResponseDto } from "@app/model/dto/response/cart-response.dto";
import { Recurrence } from "@app/model/enums/recurrence.enum";
import { IconBackComponent } from "@app/shared/icons/back.icon";
import { IconBoltComponent } from "@app/shared/icons/bolt.icon";
import { IconCheckComponent } from "@app/shared/icons/check.icon";
import { IconClockComponent } from "@app/shared/icons/clock.icon";
import { IconCloseComponent } from "@app/shared/icons/close.icon";
import { IconsModule } from "@app/shared/icons/icons.module";
import { IconTvDisplayComponent } from "@app/shared/icons/tv-display.icon";
import { IconWarningComponent } from "@app/shared/icons/warning.icon";
import { Subscription } from "rxjs";
import { ENVIRONMENT } from "src/environments/environment-token";
import { Environment } from "src/environments/environment.interface";
import { PrimengModule } from "../../primeng/primeng.module";

@Component({
  selector: "app-sidebar-mapa",
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    IconsModule,
    IconTvDisplayComponent,
    IconBoltComponent,
    IconCheckComponent,
    IconCloseComponent,
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
  streetViewUrl: string | null = null;
  loadingImage = false;
  imageError = false;

  // New properties for location information
  localInfo: {
    name?: string;
    description?: string;
    formattedAddress?: string;
  } | null = null;
  loadingLocationInfo = false;

  private readonly subscriptions = new Subscription();

  constructor(
    private readonly cartService: CartService,
    @Inject(ENVIRONMENT) private readonly env: Environment,
    private readonly toastService: ToastService,
    private readonly cdr: ChangeDetectorRef,
    private readonly clientService: ClientService
  ) {}

   ngOnInit(): void {
     // Seleção de ponto agora apenas via evento window
     window.addEventListener("monitor-marker-clicked", ((e: Event) => {
       const customEvent = e as CustomEvent;
       if (customEvent.detail?.point && !this.pontoSelecionado) {
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
     this.streetViewUrl = null;
     this.localInfo = null;
     this.pontoSelecionado = null;
   }

  voltar(): void {
    this.closeSidebar();
  }

  // private loadStreetViewImage(): void {
  //   if (!this.pontoSelecionado) return;

  //   this.loadingImage = true;
  //   this.imageError = false;

  //   const { latitude, longitude } = this.pontoSelecionado;
  //   const tamanho = "800x350";
  //   const fov = "80";
  //   const pitch = "0";
  //   const heading = "70";

  //   const apiKeyParam = this.env.googleMapsApiKey
  //     ? `&key=${this.env.googleMapsApiKey}`
  //     : "";

  //   this.streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=${tamanho}&location=${latitude},${longitude}&fov=${fov}&heading=${heading}&pitch=${pitch}${apiKeyParam}`;

  //   setTimeout(() => {
  //     this.loadingImage = false;
  //   }, 800);
  // }

  handleImageError(): void {
    this.imageError = true;
    this.loadingImage = false;
  }

  // openGoogleMaps(): void {
  //   if (!this.pontoSelecionado) return;

  //   const { latitude, longitude } = this.pontoSelecionado;
  //   const title = encodeURIComponent(
  //     this.pontoSelecionado.title || "Selected Location"
  //   );

  //   const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&query_place_id=${title}`;

  //   window.open(url, "_blank");
  // }

  getMonitorData(): any {
    if (this.pontoSelecionado?.data) {
      return this.pontoSelecionado.data;
    }
    return null;
  }

  addToList(): void {
    console.log("chamou add to list");
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
        this.toastService.sucesso("Monitor added to cart");
      },
      error: (error) => {
        this.toastService.erro("Error adding to cart");
        console.error("Error adding to cart:", error);
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
          console.error("Error updating cart:", error);
        },
      });
    }
  }

  addToWishlist(): void {
    if (this.pontoSelecionado) {
      const monitorToAdd = this.pontoSelecionado;
      this.clientService.addToWishlist(monitorToAdd.id).subscribe({
        next: () => {
          this.toastService.sucesso("Monitor added to wishlist");
        },
        error: (error) => {
          this.toastService.erro("Error adding to wishlist");
          console.error("Error adding to wishlist:", error);
        },
      });
    }
  }
}
