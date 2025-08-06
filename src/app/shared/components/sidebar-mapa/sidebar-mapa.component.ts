import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Inject,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { CartService } from "@app/core/service/api/cart.service";
import { GoogleMapsService } from "@app/core/service/api/google-maps.service";
import { MapPoint } from "@app/core/service/state/map-point.interface";
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
    IconBackComponent,
    IconTvDisplayComponent,
    IconBoltComponent,
    IconCheckComponent,
    IconCloseComponent,
    IconWarningComponent,
    IconClockComponent,
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
    private readonly mapsService: GoogleMapsService,
    private readonly cartService: CartService,
    @Inject(ENVIRONMENT) private readonly env: Environment,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.mapsService.selectedPoint$.subscribe((point) => {
        if (point) {
          this.pontoSelecionado = point;
          console.log("pontoSelecionado", this.pontoSelecionado);
          this.openSidebar();
          this.loadStreetViewImage();
          this.loadLocationDetails();
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 100);
        }
      })
    );

    window.addEventListener("monitor-marker-clicked", ((e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.point) {
        this.pontoSelecionado = customEvent.detail.point;
        this.openSidebar();
        this.loadStreetViewImage();
        this.loadLocationDetails();
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
    this.streetViewUrl = null;
    this.localInfo = null;
  }

  voltar(): void {
    this.closeSidebar();
  }

  /**
   * Loads detailed location information using the Places API
   */
  private async loadLocationDetails(): Promise<void> {
    if (!this.pontoSelecionado) return;

    this.loadingLocationInfo = true;

    try {
      const { latitude, longitude } = this.pontoSelecionado;

      // First try to find nearby establishments
      let placeDetails = await this.mapsService.getPlaceDetailsByCoordinates(
        latitude,
        longitude,
        100
      );

      if (!placeDetails) {
        // If no establishments found, try with larger radius
        placeDetails = await this.mapsService.getPlaceDetailsByCoordinates(
          latitude,
          longitude,
          500
        );
      }

      if (placeDetails) {
        this.localInfo = {
          name: placeDetails.name,
          description: placeDetails.description,
          formattedAddress: placeDetails.formattedAddress,
        };

        // Update the selected point with obtained information
        if (this.pontoSelecionado) {
          if (
            !this.pontoSelecionado.title ||
            this.pontoSelecionado.title === "Selected Location"
          ) {
            this.pontoSelecionado.title = placeDetails.name;
          }
          if (!this.pontoSelecionado.description) {
            this.pontoSelecionado.description = placeDetails.description;
          }
        }
      } else {
        // Fallback to reverse geocoding if no places found
        const geocodingResult = await this.mapsService.reverseGeocode(
          latitude,
          longitude
        );
        if (geocodingResult) {
          this.localInfo = {
            name: this.extractLocationName(geocodingResult.formattedAddress),
            description: `Location at ${geocodingResult.formattedAddress}`,
            formattedAddress: geocodingResult.formattedAddress,
          };
        } else {
          // Final fallback
          this.localInfo = {
            name: "Unidentified location",
            description: `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            formattedAddress: "",
          };
        }
      }
    } catch (error) {
      console.error("Error loading location information:", error);
      this.localInfo = {
        name: "Unidentified location",
        description: "Could not retrieve location information",
        formattedAddress: "",
      };
    } finally {
      this.loadingLocationInfo = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Extracts the location name from the formatted address
   */
  private extractLocationName(address: string): string {
    const parts = address.split(",");
    if (parts.length > 0) {
      const firstPart = parts[0].trim();
      // If it starts with a number, take the second part
      if (/^\d+/.test(firstPart) && parts.length > 1) {
        return parts[1].trim();
      }
      return firstPart;
    }
    return "Unidentified location";
  }

  /**
   * Returns the location name for display
   */
  getLocationName(): string {
    return (
      this.localInfo?.name ||
      this.pontoSelecionado?.title ||
      "Selected Location"
    );
  }

  /**
   * Returns the location description for display
   */
  getLocationDescription(): string {
    return (
      this.localInfo?.formattedAddress ||
      this.pontoSelecionado?.description ||
      ""
    );
  }

  private loadStreetViewImage(): void {
    if (!this.pontoSelecionado) return;

    this.loadingImage = true;
    this.imageError = false;

    const { latitude, longitude } = this.pontoSelecionado;
    const tamanho = "800x350";
    const fov = "80";
    const pitch = "0";
    const heading = "70";

    const apiKeyParam = this.env.googleMapsApiKey
      ? `&key=${this.env.googleMapsApiKey}`
      : "";

    this.streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=${tamanho}&location=${latitude},${longitude}&fov=${fov}&heading=${heading}&pitch=${pitch}${apiKeyParam}`;

    setTimeout(() => {
      this.loadingImage = false;
    }, 800);
  }

  handleImageError(): void {
    this.imageError = true;
    this.loadingImage = false;
  }

  openGoogleMaps(): void {
    if (!this.pontoSelecionado) return;

    const { latitude, longitude } = this.pontoSelecionado;
    const title = encodeURIComponent(
      this.pontoSelecionado.title || "Selected Location"
    );

    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&query_place_id=${title}`;

    window.open(url, "_blank");
  }

  getMonitorData(): any {
    if (this.pontoSelecionado?.data) {
      return this.pontoSelecionado.data;
    }
    return null;
  }

  addToList(): void {
    if (this.pontoSelecionado) {
      this.addToCart();
      this.closeSidebar();
    }
  }

  private addToCart(): void {
    // Check if an active cart already exists
    this.cartService.getLoggedUserCart().subscribe({
      next: (activeCart) => {
        if (activeCart) {
          // Update existing cart
          this.updateExistingCart(activeCart);
        } else {
          // Create new cart
          this.createNewCart();
        }
      },
      error: () => {
        // In case of error, create new cart
        this.createNewCart();
      },
    });
  }

  private createNewCart(): void {
    const cartRequest: CartRequestDto = {
      recurrence: Recurrence.MONTHLY,
      items: [
        {
          monitorId: this.pontoSelecionado!.id,
          blockQuantity: 1,
        },
      ],
    };

    this.cartService.addToCart(cartRequest).subscribe({
      next: () => {
        // Success adding to cart
      },
      error: (error) => {
        console.error("Error adding to cart:", error);
      },
    });
  }

  private updateExistingCart(activeCart: CartResponseDto): void {
    // Check if the monitor is already in the cart
    const existingItem = activeCart.items.find(
      (item) => item.monitorId === this.pontoSelecionado!.id
    );

    if (!existingItem) {
      // Add new item to existing cart
      const updatedItems = [
        ...activeCart.items.map((item) => ({
          monitorId: item.monitorId,
          blockQuantity: item.blockQuantity,
        })),
        {
          monitorId: this.pontoSelecionado!.id,
          blockQuantity: 1,
        },
      ];

      const cartRequest: CartRequestDto = {
        recurrence: activeCart.recurrence,
        items: updatedItems,
      };

      this.cartService.update(cartRequest, activeCart.id).subscribe({
        next: () => {
          // Success updating cart
        },
        error: (error) => {
          console.error("Error updating cart:", error);
        },
      });
    }
  }
}
