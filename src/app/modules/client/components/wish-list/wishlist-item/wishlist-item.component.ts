import { CommonModule } from "@angular/common";
import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
  ChangeDetectorRef,
} from "@angular/core";
import { CartService } from "@app/core/service/api/cart.service";
import { CartRequestDto } from "@app/model/dto/request/cart-request.dto";
import { AuthenticatedClientResponseDto } from "@app/model/dto/response/authenticated-client-response.dto";
import { CartResponseDto } from "@app/model/dto/response/cart-response.dto";
import { MonitorWishlistResponseDto } from "@app/model/dto/response/wishlist-response.dto";
import { Recurrence } from "@app/model/enums/recurrence.enum";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import {
  buildStaticMapThumbnailUrl,
  buildStreetViewThumbnailUrl,
} from "@app/shared/utils/google-maps-thumb-url.util";
import { resolvePhotoUrl } from "@app/shared/utils/photo-url.utils";
import { ENVIRONMENT } from "src/environments/environment-token";

@Component({
  selector: "app-wishlist-item",
  standalone: true,
  imports: [CommonModule, PrimengModule],
  templateUrl: "./wishlist-item.component.html",
  styleUrls: ["./wishlist-item.component.scss"],
})
export class WishlistItemComponent implements OnInit, OnChanges {
  @Input() item!: MonitorWishlistResponseDto;
  @Input() authenticatedClient!: AuthenticatedClientResponseDto;

  private readonly env = inject(ENVIRONMENT);
  private readonly cdr = inject(ChangeDetectorRef);

  isButtonDisabled = false;
  activeCart: CartResponseDto | null = null;

  private thumbAttempt = 0;
  private monitorPhotoMarkedBroken = false;

  constructor(private readonly cartService: CartService) {}

  ngOnInit(): void {
    this.checkActiveCart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["item"] && !changes["item"].firstChange) {
      this.thumbAttempt = 0;
      this.monitorPhotoMarkedBroken = false;
    }
  }

  resolveThumbSrc(): string | null {
    const n = this.thumbAttempt;
    const key = this.env.googleMapsApiKey?.trim();
    const lat = this.item.latitude;
    const lng = this.item.longitude;
    const coordsOk =
      lat != null &&
      lng != null &&
      !Number.isNaN(Number(lat)) &&
      !Number.isNaN(Number(lng));

    const monitorPhoto = resolvePhotoUrl({
      apiUrl: this.env.apiUrl,
      photoUrl: this.item.photoUrl,
    });

    if (n === 0 && monitorPhoto && !this.monitorPhotoMarkedBroken) {
      return monitorPhoto;
    }

    if (!key || !coordsOk) {
      return null;
    }

    if (n <= 1) {
      return buildStreetViewThumbnailUrl(lat, lng, key);
    }
    if (n === 2) {
      return buildStaticMapThumbnailUrl(lat, lng, key);
    }
    return null;
  }

  onThumbError(): void {
    const n = this.thumbAttempt;
    const monitorPhoto = resolvePhotoUrl({
      apiUrl: this.env.apiUrl,
      photoUrl: this.item.photoUrl,
    });
    if (n === 0 && monitorPhoto) {
      this.monitorPhotoMarkedBroken = true;
    }
    this.thumbAttempt = n + 1;
    this.cdr.markForCheck();
  }

  private checkActiveCart(): void {
    this.cartService.getLoggedUserActiveCart().subscribe({
      next: (cart) => {
        this.activeCart = cart;
        this.checkIfItemInCart();
      },
      error: () => {
        this.activeCart = null;
        this.checkIfItemInCart();
      },
    });
  }

  private checkIfItemInCart(): void {
    if (this.activeCart) {
      const isItemInCart = this.activeCart.items.some(
        (cartItem) => cartItem.monitorId === this.item.id
      );
      this.isButtonDisabled =
        isItemInCart || !this.item.hasAvailableSlots || !this.item.active;
    } else {
      this.isButtonDisabled = !this.item.hasAvailableSlots || !this.item.active;
    }
  }

  onAddToCart(): void {
    if (this.isButtonDisabled) {
      return;
    }

    if (this.activeCart) {
      this.updateExistingCart();
    } else {
      this.createNewCart();
    }
  }

  private createNewCart(): void {
    const cartRequest: CartRequestDto = {
      recurrence: Recurrence.MONTHLY,
      items: [
        {
          monitorId: this.item.id,
          blockQuantity: 1,
        },
      ],
    };

    this.cartService.addToCart(cartRequest).subscribe({
      next: (cart) => {
        this.activeCart = cart;
        this.isButtonDisabled = true;
      },
      error: () => {},
    });
  }

  private updateExistingCart(): void {
    if (!this.activeCart) return;

    const updatedItems = [
      ...this.activeCart.items.map((item) => ({
        monitorId: item.monitorId,
        blockQuantity: item.blockQuantity,
      })),
      {
        monitorId: this.item.id,
        blockQuantity: 1,
      },
    ];

    const cartRequest: CartRequestDto = {
      recurrence: this.activeCart.recurrence,
      items: updatedItems,
    };

    this.cartService.update(cartRequest, this.activeCart.id).subscribe({
      next: (cart) => {
        this.activeCart = cart;
        this.isButtonDisabled = true;
      },
      error: () => {},
    });
  }
}
