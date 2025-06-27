import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy, Inject, signal, ChangeDetectorRef } from '@angular/core';
import { PrimengModule } from '../../primeng/primeng.module';
import { CkeckoutModalComponent } from '../ckeckout-modal/ckeckout-modal.component';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Subscription } from 'rxjs';
import { ENVIRONMENT } from 'src/environments/environment-token';
import { Environment } from 'src/environments/environment.interface';
import { Authentication } from '@app/core/service/auth/autenthication';
import { DialogoUtils } from '@app/shared/utils/dialogo-config.utils';
import { DialogoComponent } from '../dialogo/dialogo.component';
import { FormatarPreco } from '@app/shared/pipes/preco.pipe';
import { ImagemCarrinhoVazioComponent } from '@app/utility/src/lib/svg/carrinho-vazio';
import { MapPoint } from '@app/core/service/state/map-point.interface';
import { GoogleMapsService } from '@app/core/service/api/google-maps.service';
import { IconsModule } from '@app/shared/icons/icons.module';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-checkout-list-side-bar',
  standalone: true,
  imports: [CommonModule, PrimengModule, ImagemCarrinhoVazioComponent, FormatarPreco, CkeckoutModalComponent, IconsModule, FormsModule],
  templateUrl: './checkout-list-side-bar.component.html',
  styleUrls: ['./checkout-list-side-bar.component.scss'],
  providers: [DialogService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CheckoutListSideBarComponent implements OnInit, OnDestroy {
  visibilidadeSidebar = false;
  listaItems: MapPoint[] = [];
  checkoutEmProgresso = false;
  dialogoRef: DynamicDialogRef | undefined;
  exibirModalCheckout = false;
  
  private readonly subscriptions = new Subscription();
  
  constructor(
    private readonly mapsService: GoogleMapsService,
    @Inject(ENVIRONMENT) private readonly env: Environment,
    private readonly dialogService: DialogService,
    private readonly authentication: Authentication
  ) {}
  
  ngOnInit(): void {
    this.carregarItens();
    
    this.subscriptions.add(
      this.mapsService.savedPoints$.subscribe(points => {
        if (points && points.length > 0) {
          this.listaItems = [...points];
          this.salvarItens();
        }
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  abrirSidebar(): void {
    this.visibilidadeSidebar = true;
  }
  
  fecharSidebar(): void {
    this.visibilidadeSidebar = false;
  }
  
  voltar(): void {
    this.fecharSidebar();
  }
  
  removerItem(item: MapPoint): void {
    const config = DialogoUtils.exibirAlerta('Do you want to remove this item from your list?', {
      acaoPrimaria: 'Remove',
      acaoSecundaria: 'Cancel',
      acaoPrimariaCallback: () => {
        this.listaItems = this.listaItems.filter(p => p.id !== item.id);
        this.salvarItens();
        this.mapsService.updateSavedPoints(this.listaItems);
        this.dialogoRef?.close();
      },
      acaoSecundariaCallback: () => {
        this.dialogoRef?.close();
      }
    });

    this.dialogoRef = this.dialogService.open(DialogoComponent, config);
  }
  
  verDetalhes(item: MapPoint): void {
    this.mapsService.selectPoint(item);
    this.fecharSidebar();
  }
  
  iniciarCheckout(): void {
    if (!this.authentication.isLoggedIn$.getValue()) {
      const config = DialogoUtils.exibirAlerta('To continue with checkout, you need to log in.', {
        acaoPrimaria: 'Log in',
        acaoSecundaria: 'Cancel',
        acaoPrimariaCallback: () => {
          window.location.href = '/authentication/login';
          this.dialogoRef?.close();
        },
        acaoSecundariaCallback: () => {
          this.dialogoRef?.close();
        }
      });
      
      this.dialogoRef = this.dialogService.open(DialogoComponent, config);
      return;
    }
    
    this.checkoutEmProgresso = true;
    
    setTimeout(() => {
      this.checkoutEmProgresso = false;
      this.abrirModalCheckout();
    }, 500);
  }
  
  abrirModalCheckout(): void {
    this.exibirModalCheckout = true;
    this.fecharSidebar();
  }
  
  fecharModalCheckout(): void {
    this.exibirModalCheckout = false;
  }
  
  finalizarPedido(): void {
    this.listaItems = [];
    this.salvarItens();
    this.mapsService.updateSavedPoints([]);
    this.exibirModalCheckout = false;
  }
  
  limparLista(): void {
    if (this.listaItems.length === 0) return;
    
    const config = DialogoUtils.exibirAlerta('Do you want to clear your entire list?', {
      acaoPrimaria: 'Clear',
      acaoSecundaria: 'Cancel',
      acaoPrimariaCallback: () => {
        this.listaItems = [];
        this.salvarItens();
        this.mapsService.updateSavedPoints([]);
        this.dialogoRef?.close();
      },
      acaoSecundariaCallback: () => {
        this.dialogoRef?.close();
      }
    });

    this.dialogoRef = this.dialogService.open(DialogoComponent, config);
  }
  
  private salvarItens(): void {
    localStorage.setItem('savedMapPoints', JSON.stringify(this.listaItems));
  }
  
  private carregarItens(): void {
    const savedItems = localStorage.getItem('savedMapPoints');
    if (savedItems) {
      try {
        this.listaItems = JSON.parse(savedItems);
        this.mapsService.updateSavedPoints(this.listaItems);
      } catch (e) {
        console.error('Error loading saved items:', e);
      }
    }
  }
  
  calcularPrecoTotal(): number {
    return this.listaItems.length * 100;
  }
  
  trackByFn(index: number, item: MapPoint): string {
    return item.id;
  }
}
