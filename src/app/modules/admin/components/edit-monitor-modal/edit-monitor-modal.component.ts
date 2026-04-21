import { CommonModule } from "@angular/common";
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ClientService } from "@app/core/service/api/client.service";
import {
  SmartPlugAdminDto,
  SmartPlugAdminService,
} from "@app/core/service/api/smart-plug-admin.service";
import { UpdateMonitorRequestDto } from "@app/model/dto/request/create-monitor.request.dto";
import { AvailablePartnerAddressResponseDto } from "@app/model/dto/response/available-partner-address.response.dto";
import { Role } from "@app/model/client";
import { Monitor } from "@app/model/monitors";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { take } from "rxjs";

@Component({
  selector: "app-edit-monitor-modal",
  standalone: true,
  imports: [CommonModule, PrimengModule, ReactiveFormsModule],
  templateUrl: "./edit-monitor-modal.component.html",
  styleUrls: ["./edit-monitor-modal.component.scss"],
})
export class EditMonitorModalComponent implements OnInit, OnChanges {
  @Input() monitor: Monitor | null = null;
  @Input() availablePartnerAddresses: AvailablePartnerAddressResponseDto[] = [];
  @Input() loadingPartnerAddresses = false;
  @Output() close = new EventEmitter<void>();
  @Output() monitorUpdated = new EventEmitter<{
    id: string;
    data: UpdateMonitorRequestDto;
    smartPlugId: string | null;
    initialSmartPlugId: string | null;
  }>();

  monitorForm: FormGroup;
  isDeveloper = false;
  plugOptions: { label: string; value: string }[] = [];
  initialSmartPlugId: string | null = null;
  addressOptions: { label: string; value: string }[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly clientService: ClientService,
    private readonly smartPlugAdmin: SmartPlugAdminService
  ) {
    this.monitorForm = this.fb.group({
      active: [true, [Validators.required]],
      locationDescription: ["", [Validators.maxLength(200)]],
      smartPlugId: [""],
      addressId: ["", [Validators.required]],
      addressPreview: this.fb.group({
        street: [{ value: "", disabled: true }],
        zipCode: [{ value: "", disabled: true }],
        city: [{ value: "", disabled: true }],
        state: [{ value: "", disabled: true }],
        country: [{ value: "", disabled: true }],
        address2: [{ value: "", disabled: true }],
      }),
    });

    this.monitorForm.get("addressId")?.valueChanges.subscribe((id: string) => {
      this.applySelectedAddressPreview(id);
    });
  }

  ngOnInit(): void {
    this.syncAddressOptions();
    this.clientService.clientAtual$
      .pipe(take(1))
      .subscribe((client) => {
        this.isDeveloper = client?.role === Role.DEVELOPER;
        if (this.monitor && this.isDeveloper) {
          this.loadPlugOptions();
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["monitor"] && this.monitor && this.monitorForm) {
      this.populateForm();
      if (this.isDeveloper) {
        this.loadPlugOptions();
      }
    }
    if (changes["availablePartnerAddresses"]) {
      this.syncAddressOptions();
    }
  }

  private populateForm(): void {
    if (!this.monitor) return;

    const addressId = this.monitor.address?.id ?? "";
    const formData = {
      active: this.monitor.active ?? true,
      locationDescription:
        (this.monitor as { locationDescription?: string }).locationDescription ??
        "",
      addressId,
    };

    this.monitorForm.patchValue(formData, { emitEvent: false });
    this.syncAddressOptions();
    this.applySelectedAddressPreview(addressId);
    this.monitorForm.markAllAsTouched();
  }

  private loadPlugOptions(): void {
    if (!this.isDeveloper || !this.monitor) {
      return;
    }
    this.smartPlugAdmin.listUnassigned(this.monitor.id).subscribe({
      next: (list) => {
        const linked = list.find((p) => p.monitorId === this.monitor!.id);
        this.initialSmartPlugId = linked?.id ?? null;
        const selected = this.initialSmartPlugId ?? "";
        this.plugOptions = [
          { label: "Nenhuma", value: "" },
          ...list.map((p) => ({
            label: this.formatPlugLabel(p),
            value: p.id,
          })),
        ];
        this.monitorForm.patchValue(
          { smartPlugId: selected },
          { emitEvent: false }
        );
      },
    });
  }

  reloadPlugOptions(): void {
    if (!this.isDeveloper || !this.monitor) {
      return;
    }
    this.loadPlugOptions();
  }

  private formatPlugLabel(p: SmartPlugAdminDto): string {
    const name = p.displayName?.trim() || p.macAddress;
    return `${name} — ${p.vendor} (${p.macAddress})`;
  }

  private syncAddressOptions(): void {
    const selected = this.monitorForm.get("addressId")?.value as string;
    const currentId = this.monitor?.address?.id;

    const base = (this.availablePartnerAddresses ?? []).map((a) => ({
      label: a.label,
      value: a.addressId,
    }));

    this.addressOptions = [...base];
    if (currentId && !this.addressOptions.some((o) => o.value === currentId)) {
      const street = this.monitor?.address?.street ?? "";
      const city = this.monitor?.address?.city ?? "";
      const state = this.monitor?.address?.state ?? "";
      const zip = this.monitor?.address?.zipCode ?? "";
      this.addressOptions = [
        {
          label: `Current screen — ${street}, ${city}, ${state}, ${zip}`,
          value: currentId,
        },
        ...this.addressOptions,
      ];
    }

    if (selected && !this.addressOptions.some((o) => o.value === selected)) {
      this.monitorForm.patchValue({ addressId: currentId ?? "" }, { emitEvent: false });
      this.applySelectedAddressPreview(this.monitorForm.get("addressId")?.value as string);
    }
  }

  private applySelectedAddressPreview(addressId: string): void {
    const preview = this.monitorForm.get("addressPreview") as FormGroup;
    if (!preview) {
      return;
    }

    const fromList = (this.availablePartnerAddresses ?? []).find(
      (a) => a.addressId === addressId
    );
    if (fromList) {
      preview.patchValue(
        {
          street: fromList.street ?? "",
          zipCode: fromList.zipCode ?? "",
          city: fromList.city ?? "",
          state: fromList.state ?? "",
          country: fromList.country ?? "",
          address2: fromList.address2 ?? "",
        },
        { emitEvent: false }
      );
      return;
    }

    if (this.monitor?.address?.id === addressId) {
      preview.patchValue(
        {
          street: this.monitor.address?.street ?? "",
          zipCode: this.monitor.address?.zipCode ?? "",
          city: this.monitor.address?.city ?? "",
          state: this.monitor.address?.state ?? "",
          country: this.monitor.address?.country ?? "",
          address2: this.monitor.address?.address2 ?? "",
        },
        { emitEvent: false }
      );
    }
  }

  onSubmit(): void {
    if (this.monitorForm.valid && this.monitor) {
      const formValue = this.monitorForm.getRawValue();

      const monitorRequest: UpdateMonitorRequestDto = {
        active: formValue.active,
        locationDescription: formValue.locationDescription,
        addressId: formValue.addressId,
      };

      const rawPlug = formValue.smartPlugId as string;
      const smartPlugId =
        this.isDeveloper && rawPlug && rawPlug.length > 0 ? rawPlug : null;

      this.monitorUpdated.emit({
        id: this.monitor.id,
        data: monitorRequest,
        smartPlugId,
        initialSmartPlugId: this.initialSmartPlugId,
      });
      this.closeModal();
    }
  }

  submit(): void {
    this.onSubmit();
  }

  cancel(): void {
    this.closeModal();
  }

  closeModal(): void {
    this.monitorForm.reset();
    this.close.emit();
  }

  getFieldError(fieldName: string, nestedField?: string): string {
    const control = nestedField
      ? this.monitorForm.get(fieldName)?.get(nestedField)
      : this.monitorForm.get(fieldName);

    if (control?.errors && control.touched) {
      if (control.errors["required"]) return "This field is required";
      if (control.errors["maxlength"])
        return `Maximum ${control.errors["maxlength"].requiredLength} characters`;
      if (control.errors["pattern"]) return "Invalid format";
      if (control.errors["min"])
        return `Minimum value is ${control.errors["min"].min}`;
      if (control.errors["max"])
        return `Maximum value is ${control.errors["max"].max}`;
    }
    return "";
  }
}
