import { Component, EventEmitter, Input, OnInit, Output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimengModule } from '../../primeng/primeng.module';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormatarPreco } from '@app/shared/pipes/preco.pipe';
import { MapPoint } from '@app/core/service/state/map-point.interface';
import { GoogleMapsService } from '@app/core/service/api/google-maps.service';
import { LoadingService } from '@app/core/service/state/loading.service';

enum StepEnum {
  REVIEW = 1,
  PAYMENT = 2,
  AD_CONTENT = 3,
  CONFIRMATION = 4
}

@Component({
  selector: 'ui-ckeckout-modal',
  standalone: true,
  imports: [CommonModule, PrimengModule, ReactiveFormsModule, FormatarPreco],
  templateUrl: './ckeckout-modal.component.html',
  styleUrls: ['./ckeckout-modal.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CkeckoutModalComponent implements OnInit {
  @Input() exibirModal = false;
  @Output() fecharModalEvent = new EventEmitter<void>();
  @Output() pedidoConcluidoEvent = new EventEmitter<void>();

  currentStep = StepEnum.REVIEW;
  totalSteps = 3;
  steps = StepEnum;
  
  paymentProcessing = false;
  confirming = false;
  locations: MapPoint[] = [];
  totalAmount = 0;
  paymentToken = '';
  paymentError = '';
  paymentCompleted = false;
  
  adDetailsForm: FormGroup;
  adImagePreview: string | null = null;
  logoPreview: string | null = null;
  
  clienteLogado = {
    name: 'Test User',
    email: 'user@test.com'
  };
  
  itensCarrinho: MapPoint[] = [];
  valorTotalPedido = 0;
  
  Math = Math;

  constructor(
    private readonly mapsService: GoogleMapsService,
    private readonly fb: FormBuilder,
    private loadingService: LoadingService
  ) {
    this.adDetailsForm = this.fb.group({
      slogan: ['', [Validators.required]],
      adImage: [null, [Validators.required]],
      logo: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.carregarLocalizacoes();
    this.calcularTotal();
  }

  private carregarLocalizacoes(): void {
    this.mapsService.savedPoints$.subscribe(points => {
      this.locations = points;
      this.itensCarrinho = points;
      this.calcularTotal();
    });
  }

  private calcularTotal(): void {
    this.totalAmount = this.locations.length * 100;
    this.valorTotalPedido = this.totalAmount;
  }

  nextStep(): void {
    if (this.currentStep === StepEnum.REVIEW) {
      this.currentStep = StepEnum.PAYMENT;
    } else if (this.currentStep === StepEnum.PAYMENT && this.paymentCompleted) {
      this.currentStep = StepEnum.AD_CONTENT;
    } else if (this.currentStep === StepEnum.AD_CONTENT) {
      if (this.adDetailsForm.valid) {
        this.finalizarProcessoCheckout();
      } else {
        Object.keys(this.adDetailsForm.controls).forEach(key => {
          this.adDetailsForm.get(key)?.markAsTouched();
        });
      }
    }
  }

  previousStep(): void {
    if (this.currentStep === StepEnum.PAYMENT) {
      this.currentStep = StepEnum.REVIEW;
    } else if (this.currentStep === StepEnum.AD_CONTENT) {
      this.currentStep = StepEnum.PAYMENT;
    } else if (this.currentStep === StepEnum.REVIEW) {
      this.fecharModal();
    }
  }
  
  finalizarProcessoCheckout(): void {
    this.confirming = true;
    
    setTimeout(() => {
      this.confirming = false;
      this.currentStep = StepEnum.CONFIRMATION;
    }, 2000);
  }

  onAdImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.adDetailsForm.patchValue({
        adImage: file
      });
      
      const reader = new FileReader();
      reader.onload = () => {
        this.adImagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onLogoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.adDetailsForm.patchValue({
        logo: file
      });
      
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  getStepTitle(): string {
    switch (this.currentStep) {
      case StepEnum.REVIEW:
        return 'Review Order';
      case StepEnum.PAYMENT:
        return 'Payment';
      case StepEnum.AD_CONTENT:
        return 'Advertisement Details';
      case StepEnum.CONFIRMATION:
        return 'Order Confirmed';
      default:
        return 'Checkout';
    }
  }

  getButtonLabel(): string {
    switch (this.currentStep) {
      case StepEnum.REVIEW:
        return 'Next: Payment';
      case StepEnum.PAYMENT:
        return this.paymentCompleted ? 'Next: Ad Details' : 'Process Payment';
      case StepEnum.AD_CONTENT:
        return 'Finalize Order';
      default:
        return 'Continue';
    }
  }

  isStepActive(step: number): boolean {
    return this.currentStep === step;
  }

  isStepCompleted(step: number): boolean {
    return this.currentStep > step;
  }

  fecharModal(): void {
    if (!this.paymentProcessing && !this.confirming) {
      this.fecharModalEvent.emit();
    }
  }

  processarPagamento(): void {
    this.paymentProcessing = true;
  }

  handlePaymentSuccess(tokenId: any): void {
    this.paymentToken = typeof tokenId === 'string' 
      ? tokenId 
      : (tokenId?.id ?? tokenId?.token ?? 'unknown-token');
    this.paymentCompleted = true;
    this.paymentProcessing = false;
  }

  handlePaymentError(errorMessage: any): void {
    this.paymentError = typeof errorMessage === 'string' 
      ? errorMessage 
      : (errorMessage?.message ?? 'An error occurred during payment processing');
    
    this.paymentProcessing = false;
  }

  finalizarPedido(): void {
    this.pedidoConcluidoEvent.emit();
  }

  trackByFn(index: number, item: MapPoint): string {
    return item.id;
  }
}
