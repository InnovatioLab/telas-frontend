import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CartService } from '@app/core/service/api/cart.service';
import { MapPoint } from '@app/core/service/state/map-point.interface';
import { ToastService } from '@app/core/service/state/toast.service';
import { CartRequestDto } from '@app/model/dto/request/cart-request.dto';
import { CartResponseDto } from '@app/model/dto/response/cart-response.dto';
import { Recurrence } from '@app/model/enums/recurrence.enum';
import { PrimengModule } from '@app/shared/primeng/primeng.module';

@Component({
  selector: 'app-pop-up-add-list',
  standalone: true,
  imports: [CommonModule, PrimengModule],
  templateUrl: './pop-up-add-list.component.html',
  styleUrls: ['./pop-up-add-list.component.scss']
})
export class PopUpStepAddListComponent {
  @Input() visible = false;
  @Input() position: { x: number, y: number } = { x: 0, y: 0 };
  @Input() selectedPoint: MapPoint | null = null;
  
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() detailsClicked = new EventEmitter<MapPoint>();
  @Output() addToListClicked = new EventEmitter<MapPoint>();

  constructor(
    private readonly cartService: CartService,
    private readonly toastService: ToastService
  ) {}

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  viewDetails(): void {
    if (this.selectedPoint) {
      this.detailsClicked.emit(this.selectedPoint);
    }
    this.close();
  }

  addToList(): void {
    if (this.selectedPoint) {
      this.addToCart();
      this.addToListClicked.emit(this.selectedPoint);
    }
    this.close();
  }

  private addToCart(): void {
    // Verificar se já existe um carrinho ativo
    this.cartService.getLoggedUserCart().subscribe({
      next: (activeCart) => {
        if (activeCart) {
          // Atualizar carrinho existente
          this.updateExistingCart(activeCart);
        } else {
          // Criar novo carrinho
          this.createNewCart();
        }
      },
      error: () => {
        // Em caso de erro, criar novo carrinho
        this.createNewCart();
      }
    });
  }

  private createNewCart(): void {
    const cartRequest: CartRequestDto = {
      recurrence: Recurrence.MONTHLY,
      items: [{
        monitorId: this.selectedPoint!.id,
        blockQuantity: 1
      }]
    };

    this.cartService.addToCart(cartRequest).subscribe({
      next: () => {
        this.toastService.sucesso('Monitor added to cart');
      },
      error: (error) => {
        console.error('Erro ao adicionar ao carrinho:', error);
        this.toastService.erro('Error adding monitor to cart');
      }
    });
  }

  private updateExistingCart(activeCart: CartResponseDto): void {
    // Verificar se o monitor já está no carrinho
    const existingItem = activeCart.items.find(item => item.monitorId === this.selectedPoint!.id);
    
    if (!existingItem) {
      // Adicionar novo item ao carrinho existente
      const updatedItems = [
        ...activeCart.items.map(item => ({
          monitorId: item.monitorId,
          blockQuantity: item.blockQuantity
        })),
        {
          monitorId: this.selectedPoint!.id,
          blockQuantity: 1
        }
      ];

      const cartRequest: CartRequestDto = {
        recurrence: activeCart.recurrence,
        items: updatedItems
      };

      this.cartService.update(cartRequest, activeCart.id).subscribe({
        next: () => {
          this.toastService.sucesso('Monitor added to cart');
        },
        error: (error) => {
          console.error('Erro ao atualizar carrinho:', error);
          this.toastService.erro('Error updating cart');
        }
      });
    } else {
      this.toastService.aviso('Monitor already in cart');
    }
  }
}
