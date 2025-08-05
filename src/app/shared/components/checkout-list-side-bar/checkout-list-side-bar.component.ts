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
import { CartRequestDto } from "@app/model/dto/request/cart-request.dto";
import {
  CartItemResponseDto,
  CartResponseDto,
} from "@app/model/dto/response/cart-response.dto";
import { Recurrence } from "@app/model/enums/recurrence.enum";
import { Monitor } from "@app/model/monitors";
import { IconsModule } from "@app/shared/icons/icons.module";
import { FormatarPreco } from "@app/shared/pipes/preco.pipe";
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
    FormatarPreco,
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

  private readonly subscriptions = new Subscription();

  constructor(
    @Inject(ENVIRONMENT) private readonly env: Environment,
    private readonly dialogService: DialogService,
    private readonly authentication: Authentication,
    private readonly cartService: CartService,
    private readonly monitorService: MonitorService,
    private readonly subscriptionService: SubscriptionService
  ) {}

  ngOnInit(): void {
    this.loadActiveCart();
    console.log("selectedRecurrence: ", this.selectedRecurrence);
    console.log("recurrenceOptions: ", this.recurrenceOptions);
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
        console.log("Cart loaded:", cart);
        this.cart = cart;
        if (cart) {
          this.selectedRecurrence = cart.recurrence;
          console.log("Selected recurrence set to:", this.selectedRecurrence);
        }
      },
      error: (error) => {
        console.error("Erro ao carregar carrinho:", error);
        this.cart = null;
      },
    });
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
        }
      },
      error: (error) => {
        console.error("Erro ao carregar detalhes do monitor:", error);
      },
    });
  }

  onRecurrenceChange(): void {
    console.log("Recurrence changed to:", this.selectedRecurrence);
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
        console.log("Cart updated successfully");
        this.loadActiveCart();
      },
      error: (error) => {
        console.error("Erro ao atualizar recorrência:", error);
      },
    });
  }

  onDropdownShow(): void {
    console.log("Dropdown opened");
    this.dropdownOpen = true;
  }

  onDropdownHide(): void {
    console.log("Dropdown closed");
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
        this.checkoutEmProgresso = false;
        console.error("Erro ao iniciar checkout:", error);
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
}
