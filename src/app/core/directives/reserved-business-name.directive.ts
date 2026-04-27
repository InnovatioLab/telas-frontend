import { Directive, HostListener, Input, Self } from "@angular/core";
import { NgControl } from "@angular/forms";
import { ToastService } from "@app/core/service/state/toast.service";

type ReservedBusinessNameError = { reservedBusinessName: true };

@Directive({
  selector: "[uiReservedBusinessName]",
  standalone: true,
})
export class ReservedBusinessNameDirective {
  @Input("uiReservedBusinessName") reservedNames: string[] | string = ["Admin"];

  private lastToastedValue: string | null = null;

  constructor(
    @Self() private readonly control: NgControl,
    private readonly toastService: ToastService
  ) {}

  @HostListener("input")
  onInput(): void {
    this.applyError();
  }

  @HostListener("blur")
  onBlur(): void {
    const invalidNow = this.applyError();
    if (!invalidNow) {
      return;
    }

    const currentValue = this.getNormalizedValue();
    if (!currentValue || this.lastToastedValue === currentValue) {
      return;
    }

    this.lastToastedValue = currentValue;
    this.toastService.aviso("Esse nome é inválido para cadastro.");
  }

  private applyError(): boolean {
    const shouldInvalidate = this.isReservedName();
    if (shouldInvalidate) {
      this.mergeError({ reservedBusinessName: true });
      return true;
    }

    this.removeErrorKey("reservedBusinessName");
    return false;
  }

  private isReservedName(): boolean {
    const value = this.getNormalizedValue();
    if (!value) {
      return false;
    }
    const list = Array.isArray(this.reservedNames)
      ? this.reservedNames
      : [this.reservedNames];
    return list.some((n) => (n ?? "").trim().toLowerCase() === value);
  }

  private getNormalizedValue(): string | null {
    const raw = this.control.control?.value;
    if (typeof raw !== "string") {
      return null;
    }
    const normalized = raw.trim().toLowerCase();
    return normalized.length > 0 ? normalized : null;
  }

  private mergeError(error: ReservedBusinessNameError): void {
    const c = this.control.control;
    if (!c) {
      return;
    }
    c.setErrors({ ...(c.errors ?? {}), ...error });
  }

  private removeErrorKey(key: keyof ReservedBusinessNameError): void {
    const c = this.control.control;
    if (!c || !c.errors || !c.errors[key]) {
      return;
    }
    const next = { ...c.errors };
    delete next[key];
    c.setErrors(Object.keys(next).length > 0 ? next : null);
  }
}

