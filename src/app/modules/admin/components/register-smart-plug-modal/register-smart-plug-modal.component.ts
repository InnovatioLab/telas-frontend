import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Output } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import {
  cursorAfterHexDigits,
  formatMacForDisplay,
  hexDigitsOnly,
  macAddressCompleteValidator,
} from "@app/shared/utils/mac-address.util";
import {
  SmartPlugAdminDto,
  SmartPlugAdminService,
} from "@app/core/service/api/smart-plug-admin.service";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { MessageService } from "primeng/api";

@Component({
  selector: "app-register-smart-plug-modal",
  standalone: true,
  imports: [CommonModule, PrimengModule, ReactiveFormsModule],
  templateUrl: "./register-smart-plug-modal.component.html",
  styleUrls: ["./register-smart-plug-modal.component.scss"],
})
export class RegisterSmartPlugModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() registered = new EventEmitter<SmartPlugAdminDto>();

  readonly form: FormGroup;
  readonly vendorOptions = [
    { label: "Kasa", value: "KASA" },
    { label: "Tapo", value: "TAPO" },
    { label: "TP-Link", value: "TPLINK" },
  ];

  submitting = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly smartPlugAdmin: SmartPlugAdminService,
    private readonly messageService: MessageService
  ) {
    this.form = this.fb.group({
      macAddress: [
        "",
        [Validators.required, macAddressCompleteValidator],
      ],
      vendor: ["KASA", [Validators.required]],
      model: ["", [Validators.maxLength(128)]],
      displayName: ["", [Validators.maxLength(255)]],
      accountEmail: ["", [Validators.maxLength(255)]],
      password: [""],
      enabled: [true],
      lastSeenIp: ["", [Validators.maxLength(45)]],
    });
  }

  submit(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const password = (v.password as string)?.trim();
    const macFormatted = formatMacForDisplay(hexDigitsOnly(v.macAddress as string));
    this.submitting = true;
    this.smartPlugAdmin
      .createInventory({
        macAddress: macFormatted,
        vendor: v.vendor as string,
        model: (v.model as string)?.trim() || null,
        displayName: (v.displayName as string)?.trim() || null,
        accountEmail: (v.accountEmail as string)?.trim() || null,
        password: password ? password : undefined,
        enabled: v.enabled as boolean,
        lastSeenIp: (v.lastSeenIp as string)?.trim() || null,
      })
      .subscribe({
        next: (dto) => {
          this.submitting = false;
          this.registered.emit(dto);
          this.reset();
          this.close.emit();
        },
        error: (err: { error?: { message?: string } }) => {
          this.submitting = false;
          const detail =
            err?.error?.message ??
            "Could not register smart plug. Check the data and try again.";
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail,
          });
        },
      });
  }

  cancel(): void {
    this.reset();
    this.close.emit();
  }

  private reset(): void {
    this.form.reset({
      macAddress: "",
      vendor: "KASA",
      model: "",
      displayName: "",
      accountEmail: "",
      password: "",
      enabled: true,
      lastSeenIp: "",
    });
  }

  fieldError(field: string): string {
    const c = this.form.get(field);
    if (!c?.errors || !c.touched) {
      return "";
    }
    if (c.errors["required"]) {
      return "Required";
    }
    if (c.errors["maxlength"]) {
      return `Max ${c.errors["maxlength"].requiredLength} characters`;
    }
    if (c.errors["macIncomplete"]) {
      return "Complete MAC address (12 hex digits, e.g. 98:BA:5F:72:66:61)";
    }
    return "";
  }

  onMacInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const start = el.selectionStart ?? 0;
    const beforeValue = el.value;
    const hexBefore = hexDigitsOnly(beforeValue.slice(0, start)).length;
    const hex = hexDigitsOnly(beforeValue).slice(0, 12);
    const formatted = formatMacForDisplay(hex);
    const control = this.form.get("macAddress");
    if (!control) {
      return;
    }
    if (formatted !== beforeValue) {
      control.setValue(formatted, { emitEvent: true });
    }
    const newPos = cursorAfterHexDigits(formatted, hexBefore);
    setTimeout(() => {
      if (document.activeElement === el) {
        el.setSelectionRange(newPos, newPos);
      }
    }, 0);
  }
}
