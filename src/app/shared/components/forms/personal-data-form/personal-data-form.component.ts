import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { TextOnlyDirective } from "@app/core/directives/text-only.directive";
import { ReservedBusinessNameDirective } from "@app/core/directives/reserved-business-name.directive";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { AbstractControlUtils } from "@app/shared/utils/abstract-control.utils";
import { DialogUtils } from "@app/shared/utils/dialog-config.utils";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { DialogComponent } from "../../dialog/dialog.component";
import { ErrorComponent } from "../../error/error.component";

@Component({
  selector: "ui-personal-data-form",
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    ReactiveFormsModule,
    ErrorComponent,
    TextOnlyDirective,
    ReservedBusinessNameDirective,
  ],
  providers: [DialogService, DialogUtils],
  templateUrl: "./personal-data-form.component.html",
  styleUrl: "./personal-data-form.component.scss",
})
export class PersonalDataFormComponent implements OnInit {
  ref: DynamicDialogRef | undefined;
  @Input() personalDataForm: FormGroup;
  @Input() habilitarFormDados: boolean;
  @Output() selectedUserType = new EventEmitter<string>();
  @Input() fieldList: string[];

  dataMaxima: Date;
  dataMinima: Date;

  socialMediaOptions = [
    { label: "Instagram", value: "instagram" },
    { label: "Facebook", value: "facebook" },
    { label: "LinkedIn", value: "linkedin" },
    { label: "X (Twitter)", value: "x" },
    { label: "TikTok", value: "tiktok" },
  ];

  constructor(
    public dialogService: DialogService,
    private readonly fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.observarTipoUsuario();
  }

  get socialMediaArray(): FormArray {
    return this.personalDataForm.get("socialMedia") as FormArray;
  }

  adicionarSocialMedia() {
    this.socialMediaArray.push(
      this.fb.group({
        platform: [null, Validators.required],
        url: [
          null,
          [
            Validators.required,
            Validators.maxLength(255),
            AbstractControlUtils.validateUrl(),
          ],
        ],
      })
    );
  }

  removerSocialMedia(index: number) {
    this.socialMediaArray.removeAt(index);
  }

  removerUltimoSocialMedia() {
    if (this.socialMediaArray.length > 0) {
      this.socialMediaArray.removeAt(this.socialMediaArray.length - 1);
    }
  }

  observarTipoUsuario() {
    this.personalDataForm.get("userType")?.valueChanges.subscribe((tipo) => {
      if (tipo) {
        this.selectedUserType.emit(
          this.personalDataForm.get("userType").value
        );
      }
    });
  }

  habilitarDados(): boolean {
    return this.habilitarFormDados;
  }

  atualizarValidacaoPessoaJuridica() {
    AbstractControlUtils.updateValidators(
      this.personalDataForm,
      "industry",
      [Validators.required, Validators.maxLength(50)]
    );
    AbstractControlUtils.updateValidators(
      this.personalDataForm,
      "websiteUrl",
      [Validators.maxLength(255), AbstractControlUtils.validateUrl()]
    );
  }

  showField(field: string): boolean {
    return this.fieldList?.includes(field);
  }

  showError(field: string): boolean {
    return AbstractControlUtils.isFieldInvalidAndTouched(
      this.personalDataForm,
      field
    );
  }

  isFieldRequired(field: string): boolean {
    return AbstractControlUtils.isFieldRequired(
      this.personalDataForm,
      field
    );
  }

  clearFieldAlertMessage(message: string, field: string) {
    const config = DialogUtils.showAlert(message, {
      primaryActionCallback: () => {
        this.ref.close();
        AbstractControlUtils.clearField(this.personalDataForm, field);
      },
    });
    this.ref = this.dialogService.open(DialogComponent, config);
  }

  onDropdownOpen(controlName: string) {
    const control = this.personalDataForm.get(controlName);
    if (control) {
      control.markAsUntouched();
    }
  }

  onDropdownClose(controlName: string) {
    const control = this.personalDataForm.get(controlName);
    if (control && !control.value) {
      control.markAsTouched();
    }
  }
}
