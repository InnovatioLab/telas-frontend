import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { TextOnlyDirective } from "@app/core/directives/text-only.directive";
import { ZipCodeService } from "@app/core/service/api/zipcode.service";
import { LoadingService } from "@app/core/service/state/loading.service";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { AbstractControlUtils } from "@app/shared/utils/abstract-control.utils";
import { DialogService } from "primeng/dynamicdialog";
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  Observable,
  of,
  switchMap,
} from "rxjs";
import { AddressData } from "../../../../model/dto/request/address-data-request";
import { ErrorComponent } from "../../error/error.component";

@Component({
  selector: "ui-form-endereco",
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    ErrorComponent,
    FormsModule,
    ReactiveFormsModule,
    TextOnlyDirective,
  ],
  templateUrl: "./form-endereco.component.html",
  styleUrl: "./form-endereco.component.scss",
  providers: [ZipCodeService],
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

  constructor(
    private readonly zipCodeService: ZipCodeService,
    public dialogService: DialogService,
    private loadingService: LoadingService
  ) {}

  ngOnInit() {
    if (!this.enderecoForm) {
      return;
    }

    if (this.enderecoForm.get("partnerAddress")) {
      this.isPartnerAddressSelected =
        !!this.enderecoForm.get("partnerAddress").value;
    }

    this.setupZipCodeSearch();
  }

  private setupZipCodeSearch(): void {
    const zipCodeControl = this.enderecoForm.get("zipCode");

    if (zipCodeControl) {
      zipCodeControl.valueChanges
        .pipe(
          debounceTime(500),
          distinctUntilChanged(),
          filter((zipCode: string) => {
            return zipCode && zipCode.length === 5 && /^\d{5}$/.test(zipCode);
          }),
          switchMap((zipCode: string): Observable<AddressData | null> => {
            if (zipCode && zipCode.length === 5 && /^\d{5}$/.test(zipCode)) {
              this.loadingService.setLoading(true, "form-endereco");
              return this.zipCodeService.findLocationByZipCode(zipCode);
            }
            return of(null);
          })
        )
        .subscribe({
          next: (addressData) => {
            if (addressData) {
              this.zipCodeEncontrado = true;
              this.loadingService.setLoading(false, "form-endereco");
              this.atualizarCamposEndereco(addressData);
            } else {
              this.zipCodeEncontrado = false;
              this.atualizarCamposEndereco({
                zipCode: zipCodeControl?.value || "",
                street: "",
                city: "",
                state: "",
                country: "",
                latitude: "",
                longitude: "",
              });
            }
          },
          error: () => {
            this.zipCodeEncontrado = false;
            this.loadingService.setLoading(false, "form-endereco");
            this.atualizarCamposEndereco({
              zipCode: zipCodeControl?.value || "",
              street: "",
              city: "",
              state: "",
              country: "",
              latitude: "",
              longitude: "",
            });
          },
        });
    }
  }

  updatePartnerAddress(value: boolean) {
    this.isPartnerAddressSelected = value;
    this.enderecoForm?.get("partnerAddress")?.setValue(value);
  }

  campoObrigatorio(campo: string): boolean {
    return AbstractControlUtils.verificarCampoRequired(
      this.enderecoForm,
      campo
    );
  }

  private atualizarCamposEndereco(result: AddressData) {
    const zipCodeControl = this.enderecoForm.get("zipCode");
    const streetControl = this.enderecoForm.get("street");
    const cityControl = this.enderecoForm.get("city");
    const stateControl = this.enderecoForm.get("state");
    const countryControl = this.enderecoForm.get("country");

    zipCodeControl?.setValue(result.zipCode || "");
    streetControl?.setValue(result.street || "");
    cityControl?.setValue(result.city || "");
    stateControl?.setValue(result.state || "");
    countryControl?.setValue(result.country || "");

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

  removeThisAddress() {
    this.removeAddress.emit(this.index);
  }

  get isLoading(): boolean {
    return this.loadingService.loadingSub.getValue();
  }
}
