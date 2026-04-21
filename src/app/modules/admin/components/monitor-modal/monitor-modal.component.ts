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
import {
  CreateMonitorRequestDto,
  UpdateMonitorRequestDto,
} from "@app/model/dto/request/create-monitor.request.dto";
import { Monitor } from "@app/model/monitors";
import { PrimengModule } from "@app/shared/primeng/primeng.module";

@Component({
  selector: "app-monitor-modal",
  standalone: true,
  imports: [CommonModule, PrimengModule, ReactiveFormsModule],
  templateUrl: "./monitor-modal.component.html",
  styleUrls: ["./monitor-modal.component.scss"],
})
export class MonitorModalComponent implements OnInit, OnChanges {
  @Input() mode: "create" | "edit" = "create";
  @Input() monitor: Monitor | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() monitorCreated = new EventEmitter<CreateMonitorRequestDto>();
  @Output() monitorUpdated = new EventEmitter<{
    id: string;
    data: UpdateMonitorRequestDto;
  }>();

  monitorForm: FormGroup;

  constructor(private readonly fb: FormBuilder) {
    this.monitorForm = this.fb.group({
      active: [true, [Validators.required]],
      locationDescription: ["", [Validators.maxLength(255)]],
      addressId: ["", [Validators.required]],
    });
  }

  ngOnInit(): void {
    if (this.mode === "edit" && this.monitor) {
      this.patchFormWithMonitor(this.monitor);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["monitor"] && this.monitor && this.mode === "edit") {
      this.patchFormWithMonitor(this.monitor);
    }
    if (changes["mode"] && this.mode === "create") {
      this.monitorForm.reset({
        active: true,
        locationDescription: "",
        addressId: "",
      });
    }
  }

  private patchFormWithMonitor(monitor: Monitor): void {
    this.monitorForm.patchValue({
      active: monitor.active,
      locationDescription: monitor.locationDescription,
      addressId: monitor.address?.id ?? "",
    });
  }

  submit(): void {
    if (this.monitorForm.valid) {
      const formValue = this.monitorForm.value;
      if (this.mode === "create") {
        const monitorRequest: CreateMonitorRequestDto = {
          locationDescription: formValue.locationDescription,
          addressId: formValue.addressId,
        };
        this.monitorCreated.emit(monitorRequest);
        this.closeModal();
      } else if (this.mode === "edit" && this.monitor) {
        const updateRequest: UpdateMonitorRequestDto = {
          active: formValue.active,
          locationDescription: formValue.locationDescription,
          addressId: formValue.addressId,
        };
        this.monitorUpdated.emit({ id: this.monitor.id, data: updateRequest });
        this.closeModal();
      }
    } else {
      Object.keys(this.monitorForm.controls).forEach((key) => {
        const control = this.monitorForm.get(key);
        control?.markAsTouched();
      });
    }
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
