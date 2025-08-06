import { CommonModule } from "@angular/common";
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Inject,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CartService } from "@app/core/service/api/cart.service";
import {
  GoogleMapsService,
  PlaceDetails,
} from "@app/core/service/api/google-maps.service";
import { MonitorService } from "@app/core/service/api/monitor.service";
import { SubscriptionService } from "@app/core/service/api/subscription.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { ToastService } from "@app/core/service/state/toast.service";
import { CartRequestDto } from "@app/model/dto/request/cart-request.dto";
import {
  CartItemResponseDto,
  CartResponseDto,
} from "@app/model/dto/response/cart-response.dto";
import { Recurrence } from "@app/model/enums/recurrence.enum";
import { Monitor } from "@app/model/monitors";
import { IconsModule } from "@app/shared/icons/icons.module";
import { DialogoUtils } from "@app/shared/utils/dialogo-config.utils";
import { ImagemCarrinhoVazioComponent } from "@app/utility/src/lib/svg/carrinho-vazio";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { Subscription } from "rxjs";
import { ENVIRONMENT } from "src/environments/environment-token";
import { Environment } from "src/environments/environment.interface";
import { PrimengModule } from "../../primeng/primeng.module";
import { DialogoComponent } from "../dialogo/dialogo.component";

@Component({
  selector: "app-checkout-list-side-bar",
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    ImagemCarrinhoVazioComponent,
    IconsModule,
    FormsModule,
  ],
  templateUrl: "./checkout-list-side-bar.component.html",
  styleUrls: ["./checkout-list-side-bar.component.scss"],
  providers: [DialogService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CheckoutListSideBarComponent implements OnInit, OnDestroy {
  visibilidadeSidebar = false;
  cart: CartResponseDto | null = null;
  selectedMonitor: Monitor | null = null;
  selectedMonitorLocationInfo: {
    name: string;
    description: string;
    photoUrl?: string;
  } | null = null;
  loadingSelectedMonitorLocationInfo: boolean = false;
  checkoutEmProgresso = false;
  dialogoRef: DynamicDialogRef | undefined;
  recurrenceOptions = [
    { label: "30 Days", value: Recurrence.THIRTY_DAYS },
    { label: "60 Days", value: Recurrence.SIXTY_DAYS },
    { label: "90 Days", value: Recurrence.NINETY_DAYS },
    { label: "Monthly", value: Recurrence.MONTHLY },
  ];
  selectedRecurrence: Recurrence = Recurrence.MONTHLY;
  monitorDetailsVisible: boolean = false;
  dropdownOpen: boolean = false;

  // Location information for each cart item
  locationInfo: Map<string, { name: string; description: string }> = new Map();
  loadingLocationInfo: Map<string, boolean> = new Map();

  private readonly subscriptions = new Subscription();

  constructor(
    @Inject(ENVIRONMENT) private readonly env: Environment,
    private readonly dialogService: DialogService,
    private readonly toastService: ToastService,
    private readonly authentication: Authentication,
    private readonly cartService: CartService,
    private readonly monitorService: MonitorService,
    private readonly subscriptionService: SubscriptionService,
    private readonly mapsService: GoogleMapsService
  ) {}

  ngOnInit(): void {
    this.loadActiveCart();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  abrirSidebar(): void {
    this.visibilidadeSidebar = true;
    this.loadActiveCart();
  }

  fecharSidebar(): void {
    this.visibilidadeSidebar = false;
    this.selectedMonitor = null;
  }

  voltar(): void {
    this.fecharSidebar();
  }

  private loadActiveCart(): void {
    this.cartService.getLoggedUserActiveCart().subscribe({
      next: (cart) => {
        this.cart = cart;
        if (cart) {
          this.selectedRecurrence = cart.recurrence;
          // Load location info for each cart item
          this.loadLocationInfoForCartItems(cart.items);
        }
      },
      error: (error) => {
        console.error("Error loading cart:", error);
        this.cart = null;
      },
    });
  }

  private loadLocationInfoForCartItems(items: CartItemResponseDto[]): void {
    items.forEach((item) => {
      this.loadLocationInfoForItem(item);
    });
  }

  private loadLocationInfoForItem(item: CartItemResponseDto): void {
    // Check if we already have location info for this item
    if (this.locationInfo.has(item.id)) {
      return;
    }

    // Mark as loading
    this.loadingLocationInfo.set(item.id, true);

    // Get monitor details first to obtain coordinates
    this.monitorService.getMonitorById(item.monitorId).subscribe({
      next: (monitor) => {
        // Use Google Maps Service to get location name and description
        this.mapsService
          .getPlaceDetailsByCoordinates(item.latitude, item.longitude)
          .then((placeDetails: PlaceDetails | null) => {
            if (placeDetails) {
              this.locationInfo.set(item.id, {
                name: placeDetails.name || "Unknown Location",
                description:
                  placeDetails.description || "No description available",
                  
              });
            } else {
              this.locationInfo.set(item.id, {
                name: "Location unavailable",
                description: "Place details not found",
              });
            }
            this.loadingLocationInfo.set(item.id, false);
          })
          .catch((error) => {
            console.warn(
              `Error getting location info for item ${item.id}:`,
              error
            );
            this.locationInfo.set(item.id, {
              name: "Location unavailable",
              description: "Unable to retrieve location information",
            });
            this.loadingLocationInfo.set(item.id, false);
          });
      },
      error: (error) => {
        console.error(
          `Error loading monitor details for item ${item.id}:`,
          error
        );
        this.locationInfo.set(item.id, {
          name: "Error loading location",
          description: "Unable to load monitor information",
        });
        this.loadingLocationInfo.set(item.id, false);
      },
    });
  }

  getLocationInfo(itemId: string): { name: string; description: string } {
    return (
      this.locationInfo.get(itemId) || {
        name: "Loading...",
        description: "Loading location info...",
      }
    );
  }

  isLoadingLocationInfo(itemId: string): boolean {
    return this.loadingLocationInfo.get(itemId) || false;
  }

  removerItem(item: CartItemResponseDto): void {
    if (!this.cart) return;

    const config = DialogoUtils.exibirAlerta(
      "Do you want to remove this item from your cart?",
      {
        acaoPrimaria: "Remove",
        acaoSecundaria: "Cancel",
        acaoPrimariaCallback: () => {
          const updatedItems = this.cart!.items.filter(
            (cartItem) => cartItem.id !== item.id
          ).map((cartItem) => ({
            monitorId: cartItem.monitorId,
            blockQuantity: cartItem.blockQuantity,
          }));

          const cartRequest: CartRequestDto = {
            recurrence: this.selectedRecurrence,
            items: updatedItems,
          };

          this.cartService.update(cartRequest, this.cart!.id).subscribe({
            next: () => {
              this.loadActiveCart();
            },
            error: (error) => {
              console.error("Erro ao remover item:", error);
            },
          });
          this.dialogoRef?.close();
        },
        acaoSecundariaCallback: () => {
          this.dialogoRef?.close();
        },
      }
    );

    this.dialogoRef = this.dialogService.open(DialogoComponent, config);
  }

  verDetalhes(item: CartItemResponseDto): void {
    this.monitorService.getMonitorById(item.monitorId).subscribe({
      next: (monitor) => {
        if (monitor) {
          this.selectedMonitor = monitor;
          this.monitorDetailsVisible = true;
          // Load location info for the selected monitor
          this.loadLocationInfoForSelectedMonitor(monitor);
          // Fechar a sidebar quando abrir o dialog de detalhes
          this.visibilidadeSidebar = false;
        }
      },
      error: (error) => {
        console.error("Erro ao carregar detalhes do monitor:", error);
      },
    });
  }

  private loadLocationInfoForSelectedMonitor(monitor: Monitor): void {
    this.selectedMonitorLocationInfo = null;
    this.loadingSelectedMonitorLocationInfo = true;

    if (monitor.address?.latitude && monitor.address?.longitude) {
      // Convert coordinates to numbers if they're strings
      const lat =
        typeof monitor.address.latitude === "string"
          ? parseFloat(monitor.address.latitude)
          : monitor.address.latitude;
      const lng =
        typeof monitor.address.longitude === "string"
          ? parseFloat(monitor.address.longitude)
          : monitor.address.longitude;

      // Use Google Maps Service to get location details including photos
      this.mapsService
        .getPlaceDetailsByCoordinates(lat, lng)
        .then((placeDetails: PlaceDetails | null) => {
          if (placeDetails) {
            const photoUrl = this.getFirstPhotoUrl(placeDetails);
            this.selectedMonitorLocationInfo = {
              name: placeDetails.name || "Unknown Location",
              description:
                placeDetails.description || "No description available",
              photoUrl: photoUrl,
            };
          } else {
            this.selectedMonitorLocationInfo = {
              name: "Location unavailable",
              description: "Place details not found",
            };
          }
          this.loadingSelectedMonitorLocationInfo = false;
        })
        .catch((error) => {
          console.warn(
            `Error getting location info for selected monitor:`,
            error
          );
          this.selectedMonitorLocationInfo = {
            name: "Location unavailable",
            description: "Unable to retrieve location information",
          };
          this.loadingSelectedMonitorLocationInfo = false;
        });
    } else {
      // No coordinates available, use fallback
      this.selectedMonitorLocationInfo = {
        name: "Location unavailable",
        description: "No coordinates available for this monitor",
      };
      this.loadingSelectedMonitorLocationInfo = false;
    }
  }

  private getFirstPhotoUrl(placeDetails: PlaceDetails): string | undefined {
    console.log("placeDetails:", placeDetails);
    console.log("photos:", placeDetails.photos);
    if (placeDetails.photos && placeDetails.photos.length > 0) {
      const photo = placeDetails.photos[0];
      return photo.getUrl({ maxWidth: 400, maxHeight: 300 });
    }
    return undefined;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = "none";
  }

  onRecurrenceChange(): void {
    if (!this.cart) return;

    const cartRequest: CartRequestDto = {
      recurrence: this.selectedRecurrence,
      items: this.cart.items.map((item) => ({
        monitorId: item.monitorId,
        blockQuantity: item.blockQuantity,
      })),
    };

    console.log("Updating cart with request:", cartRequest);
    this.cartService.update(cartRequest, this.cart.id).subscribe({
      next: () => {
        this.loadActiveCart();
      },
      error: (error) => {
        console.error("Erro ao atualizar recorrência:", error);
      },
    });
  }

  onDropdownShow(): void {
    this.dropdownOpen = true;
  }

  onDropdownHide(): void {
    this.dropdownOpen = false;
  }

  onDropdownClick(event: Event): void {
    // Previne que o clique no dropdown feche a sidebar
    event.stopPropagation();
  }

  iniciarCheckout(): void {
    if (!this.authentication.isLoggedIn$.getValue()) {
      const config = DialogoUtils.exibirAlerta(
        "To continue with checkout, you need to log in.",
        {
          acaoPrimaria: "Log in",
          acaoSecundaria: "Cancel",
          acaoPrimariaCallback: () => {
            window.location.href = "/authentication/login";
            this.dialogoRef?.close();
          },
          acaoSecundariaCallback: () => {
            this.dialogoRef?.close();
          },
        }
      );

      this.dialogoRef = this.dialogService.open(DialogoComponent, config);
      return;
    }

    if (!this.cart || this.cart.items.length === 0) {
      return;
    }

    this.checkoutEmProgresso = true;

    this.subscriptionService.checkout().subscribe({
      next: (checkoutUrl) => {
        this.checkoutEmProgresso = false;
        window.location.href = checkoutUrl;
      },
      error: (error) => {
        console.error("Erro ao iniciar checkout:", error);
        this.toastService.erro(error);
        this.checkoutEmProgresso = false;
      },
    });
  }

  trackByFn(index: number, item: CartItemResponseDto): string {
    return item.id;
  }

  unselectMonitor(): void {
    this.selectedMonitor = null;
    this.monitorDetailsVisible = false;
  }

  onMonitorDialogHide(): void {
    // Quando o dialog de detalhes do monitor for fechado, reabrir a sidebar
    this.selectedMonitor = null;
    this.selectedMonitorLocationInfo = null;
    this.loadingSelectedMonitorLocationInfo = false;
    this.monitorDetailsVisible = false;

    // Reabrir a sidebar checkout
    setTimeout(() => {
      this.visibilidadeSidebar = true;
    }, 100); // Pequeno delay para garantir que o dialog seja completamente fechado
  }
}
