import { Injectable } from "@angular/core";
import { CartService } from "@app/core/service/api/cart.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { resolvePartnerCartBlockQuantity } from "@app/core/utils/partner-permission.util";
import { MapPoint } from "@app/core/service/state/map-point.interface";
import { ToastService } from "@app/core/service/state/toast.service";
import { CartRequestDto } from "@app/model/dto/request/cart-request.dto";
import { CartResponseDto } from "@app/model/dto/response/cart-response.dto";
import { Recurrence } from "@app/model/enums/recurrence.enum";

@Injectable({ providedIn: "root" })
export class MonitorCartActionsService {
  constructor(
    private readonly cartService: CartService,
    private readonly toastService: ToastService,
    private readonly authentication: Authentication
  ) {}

  private cartBlockQuantity(): number {
    return resolvePartnerCartBlockQuantity(this.authentication.client());
  }

  addMonitorToCart(monitor: MapPoint): void {
    if (monitor.hasAvailableSlots !== true) {
      this.toastService.aviso(
        "Esta tela não tem vagas disponíveis no momento. Use a lista de desejos para ser avisado quando houver disponibilidade."
      );
      return;
    }
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
          blockQuantity: this.cartBlockQuantity(),
        },
      ],
    };

    this.cartService.addToCart(cartRequest).subscribe({
      next: () => {
        this.toastService.sucesso("Screen added to cart");
      },
      error: () => {
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
          blockQuantity: this.cartBlockQuantity(),
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
        error: () => {
          this.toastService.erro("Error updating cart");
        },
      });
    }
  }
}
