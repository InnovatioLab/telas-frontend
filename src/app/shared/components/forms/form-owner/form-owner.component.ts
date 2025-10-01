import { CommonModule } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { TextOnlyDirective } from "@app/core/directives/text-only.directive";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { AbstractControlUtils } from "@app/shared/utils/abstract-control.utils";
import { DialogoUtils } from "@app/shared/utils/dialogo-config.utils";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { DialogoComponent } from "../../dialogo/dialogo.component";
import { ErrorComponent } from "../../error/error.component";

@Component({
  selector: "ui-form-owner",
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    ReactiveFormsModule,
    ErrorComponent,
    TextOnlyDirective,
  ],
  templateUrl: "./form-owner.component.html",
  styleUrl: "./form-owner.component.scss",
})
export class FormOwnerComponent implements OnInit {
  @Input() ownerForm: FormGroup;
  ref: DynamicDialogRef | undefined;

  constructor(public dialogService: DialogService) {}

  ngOnInit(): void {
    if (!this.ownerForm) {
      console.error("ownerForm não foi inicializado.");
      return;
    }

    if (!this.ownerForm.get("ownerIdentificationNumber")) {
      this.ownerForm.addControl(
        "ownerIdentificationNumber",
        new FormControl("", [
          Validators.required,
          Validators.minLength(9),
          Validators.maxLength(9),
          Validators.pattern(/^\d{9}$/),
        ])
      );
    } else {
      this.ownerForm
        .get("ownerIdentificationNumber")
        .setValidators([
          Validators.required,
          Validators.minLength(9),
          Validators.maxLength(9),
          Validators.pattern(/^\d{9}$/),
        ]);
      this.ownerForm.get("ownerIdentificationNumber").updateValueAndValidity();
    }

    if (!this.ownerForm.get("firstName")) {
      this.ownerForm.addControl(
        "firstName",
        new FormControl("", [Validators.required, Validators.maxLength(50)])
      );
    } else {
      this.ownerForm
        .get("firstName")
        .setValidators([Validators.required, Validators.maxLength(50)]);
      this.ownerForm.get("firstName").updateValueAndValidity();
    }

    if (!this.ownerForm.get("lastName")) {
      this.ownerForm.addControl(
        "lastName",
        new FormControl("", [Validators.maxLength(150)])
      );
    } else {
      this.ownerForm.get("lastName").setValidators([Validators.maxLength(150)]);
      this.ownerForm.get("lastName").updateValueAndValidity();
    }

    if (!this.ownerForm.get("phone")) {
      this.ownerForm.addControl("phone", new FormControl("", []));
    }

    if (!this.ownerForm.get("ownerEmail")) {
      this.ownerForm.addControl(
        "ownerEmail",
        new FormControl("", [Validators.email, Validators.maxLength(255)])
      );
    } else {
      this.ownerForm
        .get("ownerEmail")
        .setValidators([Validators.email, Validators.maxLength(255)]);
      this.ownerForm.get("ownerEmail").updateValueAndValidity();
    }
  }

  campoObrigatorio(campo: string): boolean {
    const control = this.ownerForm.get(campo);

    const validatorFn = control?.validator?.({} as AbstractControl);
    if (validatorFn && "required" in validatorFn) {
      return true;
    }

    return false;
  }

  mostrarErro(form: FormGroup, campo: string): boolean {
    return form.get(campo)?.invalid && form.get(campo)?.touched;
  }

  private numeroValido(numero: string): boolean {
    const numeroLimpo = this.normalizarContato(numero);
    return (
      numeroLimpo.length >= 10 &&
      numeroLimpo.length <= 15 &&
      /^[0-9]+$/.test(numeroLimpo)
    );
  }

  private normalizarContato(numero: string): string {
    return numero.replace(/[^0-9+]/g, "");
  }

  mensagemAlertaLimparCampo(mensagem: string, campo: string) {
    const config = DialogoUtils.exibirAlerta(mensagem, {
      acaoPrimariaCallback: () => {
        this.ref.close();
        AbstractControlUtils.limparCampo(this.ownerForm, campo);
      },
    });
    this.ref = this.dialogService.open(DialogoComponent, config);
  }
}
