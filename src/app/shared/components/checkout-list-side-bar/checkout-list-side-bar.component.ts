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
    { label: "1 Month", value: Recurrence.THIRTY_DAYS },
    { label: "2 Months", value: Recurrence.SIXTY_DAYS },
    { label: "3 Months", value: Recurrence.NINETY_DAYS },
    { label: "Monthly", value: Recurrence.MONTHLY },
  ];
  selectedRecurrence: Recurrence = Recurrence.MONTHLY;
  blockQuantityOptions = [
    { label: "1", value: 1 },
    { label: "2", value: 2 },
  ];
  monitorDetailsVisible: boolean = false;
  dropdownOpen: boolean = false;
  blockQuantityInteracting: boolean = false;
  private pendingBlockQuantityUpdates: Map<string, number> = new Map();

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
    private readonly subscriptionService: SubscriptionService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.cartService.cartUpdatedStream$.subscribe({
        next: (cart) => {
          this.cart = cart;
          if (cart) {
            this.selectedRecurrence = cart.recurrence;
            this.applyPendingBlockQuantityUpdates();
            this.ensureBlockQuantityDefaults();
          }
        },
        error: (error) => {
          this.cart = null;
        },
      })
    );

    this.cart = this.cartService.currentCart;
    if (this.cart) {
      this.selectedRecurrence = this.cart.recurrence;
      this.applyPendingBlockQuantityUpdates();
      this.ensureBlockQuantityDefaults();
    }
  }

  private ensureBlockQuantityDefaults(): void {
    if (!this.cart) return;

    let needsUpdate = false;
    this.cart.items.forEach((item) => {
      if (!item.blockQuantity || item.blockQuantity < 1 || item.blockQuantity > 2) {
        item.blockQuantity = 1;
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      const cartRequest: CartRequestDto = {
        recurrence: this.selectedRecurrence,
        items: this.cart.items.map((item) => ({
          monitorId: item.monitorId,
          blockQuantity: item.blockQuantity,
        })),
      };

      this.cartService.update(cartRequest, this.cart.id).subscribe({
        next: () => {
        },
        error: (error) => {
        },
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  abrirSidebar(): void {
    this.visibilidadeSidebar = true;
    // O carrinho já está sendo observado via stream, não precisa recarregar
  }

  fecharSidebar(): void {
    this.visibilidadeSidebar = false;
    this.selectedMonitor = null;
  }

  voltar(): void {
    this.fecharSidebar();
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
            next: (updatedCart) => {
              this.cart = updatedCart;
              
              this.cartService.refreshActiveCart().subscribe({
                next: (refreshedCart) => {
                  if (refreshedCart) {
                    this.cart = refreshedCart;
                    this.selectedRecurrence = refreshedCart.recurrence;
                  }
                },
                error: () => {
                },
              });
            },
            error: (error) => {
              if (error.status === 404) {
                this.handleCartNotFound();
              }
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
    this.loadingSelectedMonitorLocationInfo = true;
    this.monitorService.getMonitorById(item.monitorId).subscribe({
      next: (monitor) => {
        if (monitor) {
          this.selectedMonitor = monitor;
          this.monitorDetailsVisible = true;
          this.visibilidadeSidebar = false;
          this.selectedMonitorLocationInfo = {
            name: item.addressLocationName,
            description: item.addressLocationDescription,
            photoUrl: item.photoUrl,
          };
          this.loadingSelectedMonitorLocationInfo = false;
        }
      },
      error: (error) => {
        this.toastService.erro("Error while loading monitor details");
        this.loadingSelectedMonitorLocationInfo = false;
      },
    });
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
        blockQuantity: item.blockQuantity || 1,
      })),
    };

    this.cartService.update(cartRequest, this.cart.id).subscribe({
      next: (updatedCart) => {
        this.cart = updatedCart;
        
        this.cartService.refreshActiveCart().subscribe({
          next: (refreshedCart) => {
            if (refreshedCart) {
              this.cart = refreshedCart;
              this.selectedRecurrence = refreshedCart.recurrence;
            }
          },
          error: () => {
          },
        });
      },
      error: (error) => {
        if (error.status === 404) {
          this.handleCartNotFound(() => {
            this.onRecurrenceChange();
          });
        }
      },
    });
  }

  onBlockQuantityChange(item: CartItemResponseDto, newValue: number): void {
    if (!this.cart) return;

    if (!newValue || newValue < 1) {
      newValue = 1;
    } else if (newValue > 2) {
      newValue = 2;
    }

    this.pendingBlockQuantityUpdates.set(item.monitorId, newValue);
    item.blockQuantity = newValue;

    const cartRequest: CartRequestDto = {
      recurrence: this.selectedRecurrence,
      items: this.cart.items.map((cartItem) => {
        const pendingValue = this.pendingBlockQuantityUpdates.get(cartItem.monitorId);
        return {
          monitorId: cartItem.monitorId,
          blockQuantity: pendingValue !== undefined ? pendingValue : (cartItem.blockQuantity || 1),
        };
      }),
    };

    this.cartService.update(cartRequest, this.cart.id).subscribe({
      next: (updatedCart) => {
        this.cart = updatedCart;
        
        const updatedItem = updatedCart.items.find(i => i.monitorId === item.monitorId);
        if (updatedItem && updatedItem.blockQuantity === newValue) {
          this.pendingBlockQuantityUpdates.delete(item.monitorId);
        }
        
        this.cartService.refreshActiveCart().subscribe({
          next: (refreshedCart) => {
            if (refreshedCart) {
              this.cart = refreshedCart;
              this.selectedRecurrence = refreshedCart.recurrence;
              
              const refreshedItem = refreshedCart.items.find(i => i.monitorId === item.monitorId);
              if (refreshedItem) {
                if (refreshedItem.blockQuantity !== newValue) {
                  refreshedItem.blockQuantity = newValue;
                  this.pendingBlockQuantityUpdates.set(item.monitorId, newValue);
                } else {
                  this.pendingBlockQuantityUpdates.delete(item.monitorId);
                }
              }
              
              this.applyPendingBlockQuantityUpdates();
            }
          },
          error: () => {
          },
        });
      },
      error: (error) => {
        if (error.status === 404) {
          this.handleCartNotFound(() => {
            this.onBlockQuantityChange(item, newValue);
          });
        } else {
          this.toastService.erro("Error updating block quantity");
          this.pendingBlockQuantityUpdates.delete(item.monitorId);
          item.blockQuantity = item.blockQuantity === 1 ? 2 : 1;
        }
      },
    });
  }

  private applyPendingBlockQuantityUpdates(): void {
    if (!this.cart || this.pendingBlockQuantityUpdates.size === 0) return;

    this.cart.items.forEach((item) => {
      const pendingValue = this.pendingBlockQuantityUpdates.get(item.monitorId);
      if (pendingValue !== undefined && item.blockQuantity !== pendingValue) {
        item.blockQuantity = pendingValue;
      }
    });
  }

  onDropdownShow(): void {
    this.dropdownOpen = true;
  }

  onDropdownHide(): void {
    this.dropdownOpen = false;
  }

  onDropdownClick(event: Event): void {
    event.stopPropagation();
  }

  onBlockQuantityMouseDown(): void {
    this.blockQuantityInteracting = true;
  }

  onBlockQuantityMouseUp(): void {
    setTimeout(() => {
      this.blockQuantityInteracting = false;
    }, 100);
  }

  onBlockQuantityClick(event: Event): void {
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

    this.applyPendingBlockQuantityUpdates();

    const cartRequest: CartRequestDto = {
      recurrence: this.selectedRecurrence,
      items: this.cart.items.map((item) => ({
        monitorId: item.monitorId,
        blockQuantity: item.blockQuantity || 1,
      })),
    };

    this.cartService.update(cartRequest, this.cart.id).subscribe({
      next: (updatedCart) => {
        this.cart = updatedCart;
        this.pendingBlockQuantityUpdates.clear();
        
        this.cartService.refreshActiveCart().subscribe({
          next: (refreshedCart) => {
            if (refreshedCart) {
              this.cart = refreshedCart;
              this.selectedRecurrence = refreshedCart.recurrence;
            }
            
            this.subscriptionService.checkout().subscribe({
              next: (checkoutUrl) => {
                this.checkoutEmProgresso = false;
                window.location.href = checkoutUrl;
              },
              error: (error) => {
                this.toastService.erro(error);
                this.checkoutEmProgresso = false;
              },
            });
          },
          error: (error) => {
            this.subscriptionService.checkout().subscribe({
              next: (checkoutUrl) => {
                this.checkoutEmProgresso = false;
                window.location.href = checkoutUrl;
              },
              error: (checkoutError) => {
                this.toastService.erro(checkoutError);
                this.checkoutEmProgresso = false;
              },
            });
          },
        });
      },
      error: (error) => {
        if (error.status === 404) {
          this.handleCartNotFound(() => {
            this.iniciarCheckout();
          });
        } else {
          this.toastService.erro("Error updating cart before checkout");
          this.checkoutEmProgresso = false;
        }
      },
    });
  }

  private handleCartNotFound(callback?: () => void): void {
    this.cartService.refreshActiveCart().subscribe({
      next: (refreshedCart) => {
        if (refreshedCart) {
          this.cart = refreshedCart;
          this.selectedRecurrence = refreshedCart.recurrence;
          this.applyPendingBlockQuantityUpdates();
          this.ensureBlockQuantityDefaults();
          
          if (callback) {
            callback();
          }
        } else {
          if (this.cart && this.cart.items.length > 0) {
            const cartRequest: CartRequestDto = {
              recurrence: this.selectedRecurrence,
              items: this.cart.items.map((item) => ({
                monitorId: item.monitorId,
                blockQuantity: item.blockQuantity || 1,
              })),
            };

            this.cartService.addToCart(cartRequest).subscribe({
              next: (newCart) => {
                this.cart = newCart;
                this.selectedRecurrence = newCart.recurrence;
                this.pendingBlockQuantityUpdates.clear();
                
                if (callback) {
                  callback();
                }
              },
              error: (error) => {
                this.toastService.erro("Error creating new cart");
                this.checkoutEmProgresso = false;
              },
            });
          } else {
            this.toastService.erro("Cart not found and no items to recreate");
            this.checkoutEmProgresso = false;
          }
        }
      },
      error: (error) => {
        this.toastService.erro("Error refreshing cart");
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
    this.selectedMonitor = null;
    this.selectedMonitorLocationInfo = null;
    this.loadingSelectedMonitorLocationInfo = false;
    this.monitorDetailsVisible = false;

    setTimeout(() => {
      this.visibilidadeSidebar = true;
    }, 100);
  }
}
