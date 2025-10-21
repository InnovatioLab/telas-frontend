import { CommonModule } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";
import { CartService } from "@app/core/service/api/cart.service";
import { CartRequestDto } from "@app/model/dto/request/cart-request.dto";
import { AuthenticatedClientResponseDto } from "@app/model/dto/response/authenticated-client-response.dto";
import { CartResponseDto } from "@app/model/dto/response/cart-response.dto";
import { MonitorWishlistResponseDto } from "@app/model/dto/response/wishlist-response.dto";
import { Recurrence } from "@app/model/enums/recurrence.enum";
import { PrimengModule } from "@app/shared/primeng/primeng.module";

@Component({
  selector: "app-wishlist-item",
  standalone: true,
  imports: [CommonModule, PrimengModule],
  templateUrl: "./wishlist-item.component.html",
  styleUrls: ["./wishlist-item.component.scss"],
})
export class WishlistItemComponent implements OnInit {
  @Input() item!: MonitorWishlistResponseDto;
  @Input() authenticatedClient!: AuthenticatedClientResponseDto;

  isButtonDisabled = false;
  activeCart: CartResponseDto | null = null;

  constructor(private readonly cartService: CartService) {}

  ngOnInit(): void {
    this.checkActiveCart();
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

  get displayAvailable(): string {
    return this.item.hasAvailableSlots ? "Available" : "Not Available";
  }

  get showEstimatedDate(): boolean {
    return (
      this.item.estimatedSlotReleaseDate !== null &&
      !this.item.hasAvailableSlots
    );
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
      error: (error) => {
        console.error("Error creating cart:", error);
      },
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
      error: (error) => {
        console.error("Error updating cart:", error);
      },
    });
  }
}
