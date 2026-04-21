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
import { CreateMonitorRequestDto } from "@app/model/dto/request/create-monitor.request.dto";
import { AvailablePartnerAddressResponseDto } from "@app/model/dto/response/available-partner-address.response.dto";
import { Role } from "@app/model/client";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { take } from "rxjs";

@Component({
  selector: "app-create-monitor-modal",
  standalone: true,
  imports: [CommonModule, PrimengModule, ReactiveFormsModule],
  templateUrl: "./create-monitor-modal.component.html",
  styleUrls: ["./create-monitor-modal.component.scss"],
})
export class CreateMonitorModalComponent implements OnInit, OnChanges {
  @Input() availablePartnerAddresses: AvailablePartnerAddressResponseDto[] = [];
  @Input() loadingPartnerAddresses = false;

  @Output() close = new EventEmitter<void>();
  @Output() monitorCreated = new EventEmitter<{
    request: CreateMonitorRequestDto;
    smartPlugId: string | null;
  }>();

  monitorForm: FormGroup;

  isDeveloper = false;
  plugOptions: { label: string; value: string }[] = [];
  addressOptions: { label: string; value: string }[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly clientService: ClientService,
    private readonly smartPlugAdmin: SmartPlugAdminService
  ) {
    this.monitorForm = this.fb.group({
      addressId: ["", [Validators.required]],
      locationDescription: ["", [Validators.maxLength(200)]],
      smartPlugId: [""],
    });
  }

  ngOnInit(): void {
    this.syncAddressOptions();
    this.clientService.clientAtual$
      .pipe(take(1))
      .subscribe((client) => {
        this.isDeveloper = client?.role === Role.DEVELOPER;
        if (this.isDeveloper) {
          this.loadPlugOptions();
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["availablePartnerAddresses"]) {
      this.syncAddressOptions();
    }
  }

  private loadPlugOptions(): void {
    this.smartPlugAdmin.listUnassigned().subscribe({
      next: (list) => {
        this.plugOptions = [
          { label: "Nenhuma", value: "" },
          ...list.map((p) => ({
            label: this.formatPlugLabel(p),
            value: p.id,
          })),
        ];
      },
    });
  }

  reloadPlugOptions(): void {
    if (!this.isDeveloper) {
      return;
    }
    this.loadPlugOptions();
  }

  private syncAddressOptions(): void {
    const selected = this.monitorForm.get("addressId")?.value as string;
    this.addressOptions = (this.availablePartnerAddresses ?? []).map((a) => ({
      label: a.label,
      value: a.addressId,
    }));

    if (selected && !this.addressOptions.some((o) => o.value === selected)) {
      this.monitorForm.patchValue({ addressId: "" }, { emitEvent: false });
    }
  }

  private formatPlugLabel(p: SmartPlugAdminDto): string {
    const name = p.displayName?.trim() || p.macAddress;
    return `${name} — ${p.vendor} (${p.macAddress})`;
  }

  onSubmit(): void {
    if (this.monitorForm.valid) {
      const formValue = this.monitorForm.value;

      const monitorRequest: CreateMonitorRequestDto = {
        locationDescription: formValue.locationDescription,
        addressId: formValue.addressId,
      };

      const rawPlug = formValue.smartPlugId as string;
      const smartPlugId =
        this.isDeveloper && rawPlug && rawPlug.length > 0 ? rawPlug : null;

      this.monitorCreated.emit({ request: monitorRequest, smartPlugId });
    } else {
      Object.keys(this.monitorForm.controls).forEach((key) => {
        const control = this.monitorForm.get(key);
        control?.markAsTouched();
      });
    }
  }

  submit(): void {
    this.onSubmit();
  }

  cancel(): void {
    this.closeModal();
  }

  closeModal(): void {
    this.monitorForm.reset({
      addressId: "",
      locationDescription: "",
      smartPlugId: "",
    });
    this.close.emit();
  }

  getFieldError(fieldName: string): string {
    const control = this.monitorForm.get(fieldName);

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
