import { AbstractControl, ValidationErrors } from "@angular/forms";

const HEX = /^[0-9A-Fa-f]$/;

export function hexDigitsOnly(value: string): string {
  return value.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
}

export function formatMacForDisplay(hexUpTo12: string): string {
  const h = hexUpTo12.slice(0, 12);
  const parts: string[] = [];
  for (let i = 0; i < h.length; i += 2) {
    parts.push(h.slice(i, i + 2));
  }
  return parts.join(":");
}

export function cursorAfterHexDigits(formatted: string, hexCount: number): number {
  if (hexCount <= 0) {
    return 0;
  }
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    const c = formatted[i];
    if (c && HEX.test(c)) {
      seen += 1;
      if (seen === hexCount) {
        return i + 1;
      }
    }
  }
  return formatted.length;
}

export function macAddressCompleteValidator(
  control: AbstractControl
): ValidationErrors | null {
  const raw = control.value as string | null | undefined;
  if (raw == null || raw === "") {
    return null;
  }
  const hex = hexDigitsOnly(raw);
  if (hex.length !== 12) {
    return { macIncomplete: true };
  }
  return null;
}
