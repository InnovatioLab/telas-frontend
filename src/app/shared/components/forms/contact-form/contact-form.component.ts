import { CommonModule } from "@angular/common";
import { Component, inject, Input, OnInit } from "@angular/core";
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ClientService } from "@app/core/service/api/client.service";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { AbstractControlUtils } from "@app/shared/utils/abstract-control.utils";
import { DialogUtils } from "@app/shared/utils/dialog-config.utils";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { DialogComponent } from "../../dialog/dialog.component";
import { ErrorComponent } from "../../error/error.component";

@Component({
  selector: "ui-contact-form",
  standalone: true,
  imports: [CommonModule, PrimengModule, ReactiveFormsModule, ErrorComponent],
  templateUrl: "./contact-form.component.html",
  styleUrl: "./contact-form.component.scss",
})
export class ContactFormComponent implements OnInit {
  @Input() contactForm: FormGroup;
  ref: DynamicDialogRef | undefined;
  private readonly clientService = inject(ClientService);

  constructor(public dialogService: DialogService) {}

  ngOnInit(): void {
    if (!this.contactForm) {
      return;
    }

    if (!this.contactForm.get("numeroContato")) {
      this.contactForm.addControl(
        "numeroContato",
        new FormControl("", [
          Validators.required,
          AbstractControlUtils.validatePhone(),
        ])
      );
    } else {
      this.contactForm
        .get("numeroContato")
        .setValidators([
          Validators.required,
          AbstractControlUtils.validatePhone(),
        ]);
      this.contactForm.get("numeroContato").updateValueAndValidity();
    }
    if (!this.contactForm.get("email")) {
      this.contactForm.addControl(
        "email",
        new FormControl("", [
          Validators.required,
          Validators.email,
          Validators.maxLength(255),
        ])
      );
    } else {
      this.contactForm
        .get("email")
        .setValidators([
          Validators.required,
          Validators.email,
          Validators.maxLength(255),
        ]);
      this.contactForm.get("email").updateValueAndValidity();
    }

    if (this.contactForm.get("state")) {
      this.contactForm.removeControl("state");
    }
  }

  isFieldRequired(field: string): boolean {
    const control = this.contactForm.get(field);

    const validatorFn = control?.validator?.({} as AbstractControl);
    if (validatorFn && "required" in validatorFn) {
      return true;
    }

    return false;
  }

  showError(form: FormGroup, field: string): boolean {
    return form.get(field)?.invalid && form.get(field)?.touched;
  }

  clearFieldAlertMessage(message: string, field: string) {
    const config = DialogUtils.showAlert(message, {
      primaryActionCallback: () => {
        this.ref.close();
        AbstractControlUtils.clearField(this.contactForm, field);
      },
    });
    this.ref = this.dialogService.open(DialogComponent, config);
  }
}
