import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DialogService } from 'primeng/dynamicdialog';
import { AddressData } from '../../../../model/dto/request/address-data-request';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { ErrorComponent } from '../../error/error.component';
import { ZipCodeValidatorDirective } from '@app/core/directives/zip-code-validator.directive';
import { AbstractControlUtils } from '@app/shared/utils/abstract-control.utils';
import { ZipCodeService } from '@app/core/service/api/zipcode.service';
import { LoadingService } from '@app/core/service/state/loading.service';

@Component({
  selector: 'ui-form-endereco',
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    ErrorComponent,
    ZipCodeValidatorDirective,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './form-endereco.component.html',
  styleUrl: './form-endereco.component.scss',
  providers: [ZipCodeService]
})
export class FormEnderecoComponent implements OnInit {
  @Input() enderecoForm!: FormGroup;
  @Input() index = 0;
  @Input() showRemoveButton = false;
  @Input() isPartnerAddress = false;

  @Output() removeAddress = new EventEmitter<number>();

  isPartnerAddressSelected = false;

  latitude: string | null = null;
  longitude: string | null = null;

  @Output() latitudeChange = new EventEmitter<string | null>();
  @Output() longitudeChange = new EventEmitter<string | null>();

  zipCodeEncontrado = true;

  private lastSearchedZipCode: string | null = null;

  constructor(
    private readonly zipCodeService: ZipCodeService, 
    public dialogService: DialogService,
    private loadingService: LoadingService
  ) {}

  ngOnInit() {
    if (!this.enderecoForm) {
      return;
    }

    if (this.enderecoForm.get('partnerAddress')) {
      this.isPartnerAddressSelected = !!this.enderecoForm.get('partnerAddress').value;
    }
  }

  updatePartnerAddress(value: boolean) {
    this.isPartnerAddressSelected = value;
    this.enderecoForm?.get('partnerAddress')?.setValue(value);
  }

  campoObrigatorio(campo: string): boolean {
    return AbstractControlUtils.verificarCampoRequired(this.enderecoForm, campo);
  }

  private atualizarCamposEndereco(result: AddressData) {
    const zipCodeControl = this.enderecoForm.get('zipCode');
    const streetControl = this.enderecoForm.get('street');
    const cityControl = this.enderecoForm.get('city');
    const stateControl = this.enderecoForm.get('state');
    const countryControl = this.enderecoForm.get('country');

    zipCodeControl?.setValue(result.zipCode || '');
    streetControl?.setValue(result.street || '');
    cityControl?.setValue(result.city || '');
    stateControl?.setValue(result.state || '');
    countryControl?.setValue(result.country || '');

    this.latitude = result.latitude || null;
    this.longitude = result.longitude || null;

    this.latitudeChange.emit(this.latitude);
    this.longitudeChange.emit(this.longitude);

    zipCodeControl?.markAsTouched();
    streetControl?.markAsTouched();
    cityControl?.markAsTouched();
    stateControl?.markAsTouched();
    countryControl?.markAsTouched();
  }

  searchZipCode() {
    const zipCode = this.enderecoForm.get('zipCode')?.value;

    if (!zipCode || zipCode.includes('_')) {
      return;
    }

    const cleanZipCode = zipCode.replace(/\D/g, '');

    if (cleanZipCode === this.lastSearchedZipCode) {
      return;
    }

    if (/^0{5}$/.test(cleanZipCode)) {
      this.enderecoForm.get('zipCode')?.setErrors({ 'invalidZipCode': true });
      return;
    }

    if (cleanZipCode && cleanZipCode.length === 5) {
      this.loadingService.setLoading(true, 'form-endereco');
      this.lastSearchedZipCode = cleanZipCode;

      this.zipCodeService.findLocationByZipCode(cleanZipCode).subscribe({
        next: (result) => {
          if (result) {
            this.zipCodeEncontrado = true;
            this.atualizarCamposEndereco(result);
          } else {
            this.zipCodeEncontrado = false;
            this.atualizarCamposEndereco({
              zipCode: cleanZipCode,
              street: '',
              city: '',
              state: '',
              country: '',
              latitude: '',
              longitude: '',
            });
          }
          this.loadingService.setLoading(false, 'form-endereco');
        },
        error: () => {
          this.zipCodeEncontrado = false;
          this.atualizarCamposEndereco({
            zipCode: cleanZipCode,
            street: '',
            city: '',
            state: '',
            country: '',
            latitude: '',
            longitude: '',
          });
          this.loadingService.setLoading(false, 'form-endereco');
        }
      });
    }
  }

  removeThisAddress() {
    this.removeAddress.emit(this.index);
  }

  get isLoading(): boolean {
    return this.loadingService.loadingSub.getValue();
  }
}
