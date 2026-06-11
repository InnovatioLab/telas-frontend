import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from "@angular/forms";
import { DateFormatter } from "@app/shared/utils/date-formatter.utils";
export class AbstractControlUtils {
  private static readonly PHONE_REGEX = /^(?:\+?1)?\d{10}$/;
  private static readonly URL_REGEX =
    /^(?:https?:\/\/|www\.)((?!-)[A-Za-z0-9-]{1,63}(?<!-)(?:\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*)\.([A-Za-z]{2,63})(?::\d{1,5})?(?:\/[^\s]*)?(?:\?[^\s#]*)?(?:#[^\s]*)?$/i;

  static disableField(form: FormGroup, field: string): void {
    form.get(field).disable();
  }

  static disableAndClearField(form: FormGroup, field: string): void {
    form.get(field).disable();
    form.get(field).reset();
    form.get(field).clearValidators();
    form.get(field).updateValueAndValidity();
  }

  static enableField(form: FormGroup, field: string): void {
    form.get(field).enable();
  }

  static enableFields(form: FormGroup, fields: string[]): void {
    fields.forEach((field) => form.get(field).enable());
  }

  static makeFieldsRequired(form: FormGroup, fields: string[]): void {
    fields.forEach((field) => {
      form.get(field).setValidators(Validators.required);
      form.get(field).updateValueAndValidity();
    });
  }

  static makeFieldRequired(form: FormGroup, field: string): void {
    form.get(field).setValidators(Validators.required);
    form.get(field).updateValueAndValidity();
  }

  static removeFieldsRequired(form: FormGroup, fields: string[]): void {
    fields.forEach((field) => {
      form.get(field).removeValidators(Validators.required);
      form.get(field).updateValueAndValidity();
    });
  }

  static removeFieldRequired(form: FormGroup, field: string): void {
    form.get(field).removeValidators(Validators.required);
    form.get(field).updateValueAndValidity();
  }

  static updateValidators(
    form: FormGroup,
    field: string,
    validators: ValidatorFn | ValidatorFn[]
  ): void {
    form.get(field).setValidators(validators);
    form.get(field).updateValueAndValidity();
  }

  static updateFieldValue(
    form: FormGroup,
    field: string,
    value: string | string[] | number | Date | null
  ): void {
    form.get(field).patchValue(value);
  }

  static removeCPFMask(form: FormGroup): string {
    const cpfField = form.get("cpf");
    const formattedCpf: string = cpfField.value.replaceAll(/[.-]/g, "");
    cpfField.setValue(formattedCpf);
    return formattedCpf;
  }

  static formatDateTimeBR(dateTime: string): string {
    if (!dateTime) {
      return "-";
    }

    const formatted = DateFormatter.formatDateTime(dateTime);
    return formatted || "-";
  }

  static parseStringToDate(dateString: string): Date | null {
    if (!dateString) {
      return null;
    }

    const parts = dateString.split("-");
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    return new Date(year, month, day);
  }

  static enableFieldsAndMakeRequired(
    form: FormGroup,
    controls: string[]
  ): void {
    controls.forEach((control) => {
      form.get(control).enable();
      form.get(control).setValidators(Validators.required);
      form.get(control).updateValueAndValidity();
    });
  }

  static enableFieldAndMakeRequired(form: FormGroup, control: string): void {
    form.get(control).enable();
    form.get(control).setValidators(Validators.required);
    form.get(control).updateValueAndValidity();
  }

  static disableAndClearFields(form: FormGroup, controls: string[]): void {
    controls.forEach((control) => {
      form.get(control).disable();
      form.get(control).reset();
      form.get(control).clearValidators();
      form.get(control).updateValueAndValidity();
    });
  }

  static setValidators(
    form: FormGroup,
    control: string,
    validator: ValidatorFn | ValidatorFn[] | null
  ): void {
    form.get(control).setValidators(validator);
    form.get(control).updateValueAndValidity();
  }

  static clearField(form: FormGroup, field: string): void {
    form.get(field).reset();
  }

  static clearFields(form: FormGroup, fields: string[]): void {
    fields.forEach((field) => {
      const control = form.get(field);
      if (control) {
        control.reset();
      }
    });
  }

  static isFormUnchanged(
    currentForm: FormGroup,
    initialForm: FormGroup
  ): boolean {
    const currentJson = JSON.stringify(currentForm.value);
    const initialJson = JSON.stringify(initialForm.value);
    return currentJson == initialJson;
  }

  static resetFormExcludingField(
    currentForm: FormGroup,
    exceptName: string
  ) {
    Object.keys(currentForm.controls).forEach((key) => {
      if (key !== exceptName) {
        currentForm.get(key)?.reset();
      }
    });
  }

  static isFieldRequired(form: FormGroup, field: string) {
    const control = form.get(field);
    if (control?.validator) {
      const validatorFn = control.validator({} as AbstractControl);
      if (validatorFn && "required" in validatorFn) {
        return true;
      }
    }
    return false;
  }

  static isFieldInvalidAndTouched(form: FormGroup, field: string) {
    if (form.get(field)) {
      return form.get(field)?.invalid && form.get(field)?.touched;
    }
    return false;
  }

  static acceptOnlyText(form: FormGroup, field: string): void {
    form.get(field)?.valueChanges.subscribe((name) => {
      const lettersRegex = /^[\p{L}\s.,-]*$/u;
      if (!lettersRegex.test(name)) {
        form.get(field).setValue(name.slice(0, -1));
      }
    });
  }

  static addFileToList(
    form: FormGroup,
    field: string,
    file: File
  ): void {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const filesList = form.get(field)?.value ?? [];
      filesList.push({
        name: file.name,
        bytes: reader.result,
        type: file.type,
      });
      form.get(field).setValue(filesList);
      form.updateValueAndValidity();
    };
  }

  static removeFileFromList(
    form: FormGroup,
    field: string,
    index: number
  ): void {
    const filesList = form.get(field)?.value ?? [];
    filesList.splice(index, 1);
    form.get(field).setValue(filesList);
    form.updateValueAndValidity();
  }

  static validateStreet(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (typeof value !== "string" || value.trim() === "") {
        return { invalidAddress: true };
      }
      const regex = /^[a-zA-Z0-9\s.,'-]+$/;
      return regex.test(value.trim()) ? null : { invalidStreet: true };
    };
  }

  static validatePhone(): ValidatorFn {
    return ({ value }: AbstractControl): ValidationErrors | null => {
      if (typeof value !== "string" || value.trim() === "") return null;
      const digits = value.replace(/\D/g, "");
      return AbstractControlUtils.PHONE_REGEX.test(digits)
        ? null
        : { invalidPhone: true };
    };
  }

  static validateUrl(): ValidatorFn {
    return ({ value }: AbstractControl): ValidationErrors | null => {
      if (typeof value !== "string" || value.trim() === "") return null;
      return AbstractControlUtils.URL_REGEX.test(value.trim())
        ? null
        : { invalidUrl: true };
    };
  }
}
