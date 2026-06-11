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
  switchMap,
} from "rxjs";
import { AddressData } from "../../../../model/dto/request/address-data-request";
import { ErrorComponent } from "../../error/error.component";

@Component({
  selector: "ui-address-form",
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    ErrorComponent,
    FormsModule,
    ReactiveFormsModule,
    TextOnlyDirective,
  ],
  templateUrl: "./address-form.component.html",
  styleUrl: "./address-form.component.scss",
  providers: [ZipCodeService],
})
export class AddressFormComponent implements OnInit {
  @Input() addressForm!: FormGroup;
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
    if (!this.addressForm) {
      return;
    }

    if (this.addressForm.get("partnerAddress")) {
      this.isPartnerAddressSelected =
        !!this.addressForm.get("partnerAddress").value;
    }

    this.setupZipCodeSearch();
  }

  private setupZipCodeSearch(): void {
    const zipCodeControl = this.addressForm.get("zipCode");

    if (!zipCodeControl) {
      return;
    }

    zipCodeControl.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        filter(
          (zipCode: string): zipCode is string =>
            !!zipCode && zipCode.length === 5 && /^\d{5}$/.test(zipCode)
        ),
        switchMap((zipCode: string): Observable<AddressData | null> => {
          this.loadingService.setLoading(true, "form-endereco");
          return this.zipCodeService.findLocationByZipCode(zipCode);
        })
      )
      .subscribe({
        next: (addressData) => {
          if (addressData) {
            this.zipCodeEncontrado = true;
            this.fillAddressFields(addressData);
          } else {
            this.zipCodeEncontrado = false;
          }
          this.loadingService.setLoading(false, "form-endereco");
        },
        error: () => {
          this.zipCodeEncontrado = false;
          this.loadingService.setLoading(false, "form-endereco");
        },
      });
  }

  updatePartnerAddress(value: boolean) {
    this.isPartnerAddressSelected = value;
    this.addressForm?.get("partnerAddress")?.setValue(value);
  }

  isFieldRequired(field: string): boolean {
    return AbstractControlUtils.isFieldRequired(
      this.addressForm,
      field
    );
  }

  private fillAddressFields(result: AddressData) {
    const fieldMap: Array<{ key: keyof AddressData; control: string }> = [
      { key: "street", control: "street" },
      { key: "city", control: "city" },
      { key: "state", control: "state" },
      { key: "country", control: "country" },
    ];

    const payload: Partial<Record<string, string>> = {};
    const touched: string[] = [];

    for (const { key, control } of fieldMap) {
      const value = result[key];
      if (typeof value === "string" && value !== "") {
        payload[control] = value;
        touched.push(control);
      }
    }

    if (Object.keys(payload).length > 0) {
      this.addressForm.patchValue(payload);
      for (const name of touched) {
        this.addressForm.get(name)?.markAsTouched();
      }
    }


    if (result.latitude && result.longitude) {
      this.latitude = result.latitude;
      this.longitude = result.longitude;
      this.latitudeChange.emit(this.latitude);
      this.longitudeChange.emit(this.longitude);
    }
  }

  removeThisAddress() {
    this.removeAddress.emit(this.index);
  }

  get isLoading(): boolean {
    return this.loadingService.loadingSub.getValue();
  }
}
